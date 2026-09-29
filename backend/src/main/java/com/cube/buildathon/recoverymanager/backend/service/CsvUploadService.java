package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.config.TenantDatabaseScope;
import com.cube.buildathon.recoverymanager.backend.dto.CsvValidationResult;
import com.cube.buildathon.recoverymanager.backend.dto.ParsedChargeRow;
import com.cube.buildathon.recoverymanager.backend.dto.RowValidationError;
import com.cube.buildathon.recoverymanager.backend.dto.UploadResponse;
import com.cube.buildathon.recoverymanager.backend.entity.AnalysisRun;
import com.cube.buildathon.recoverymanager.backend.entity.Charge;
import com.cube.buildathon.recoverymanager.backend.entity.ValidationIssue;
import com.cube.buildathon.recoverymanager.backend.enums.AnalysisRunStatus;
import com.cube.buildathon.recoverymanager.backend.exception.ApiException;
import com.cube.buildathon.recoverymanager.backend.repository.AnalysisRunRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ChargeRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ValidationIssueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class CsvUploadService {
    private final CsvValidationService csvValidationService;
    private final AnalysisRunRepository analysisRunRepository;
    private final ChargeRepository chargeRepository;
    private final ValidationIssueRepository validationIssueRepository;
    private final TenantDatabaseScope tenantDatabaseScope;

    public CsvUploadService(
            CsvValidationService csvValidationService,
            AnalysisRunRepository analysisRunRepository,
            ChargeRepository chargeRepository,
            ValidationIssueRepository validationIssueRepository,
            TenantDatabaseScope tenantDatabaseScope
    ) {
        this.csvValidationService = csvValidationService;
        this.analysisRunRepository = analysisRunRepository;
        this.chargeRepository = chargeRepository;
        this.validationIssueRepository = validationIssueRepository;
        this.tenantDatabaseScope = tenantDatabaseScope;
    }

    @Transactional
    public UploadResponse upload(MultipartFile file) {
        tenantDatabaseScope.applyToCurrentTransaction();
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "A non-empty CSV file is required");
        }

        String fileName = safeFileName(file.getOriginalFilename());
        if (!fileName.toLowerCase().endsWith(".csv") && !"text/csv".equalsIgnoreCase(file.getContentType())) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "INVALID_FILE_TYPE", "Only CSV files are supported");
        }

        String orgId = tenantDatabaseScope.currentOrgId();
        AnalysisRun run = new AnalysisRun();
        run.setAnalysisId("ANL-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        run.setOrgId(orgId);
        run.setFileName(fileName);
        run.setStatus(AnalysisRunStatus.VALIDATING);
        run.setCurrentStage("Validating CSV");
        analysisRunRepository.saveAndFlush(run);

        CsvValidationResult validation;
        try {
            validation = csvValidationService.validateCsv(file);
        } catch (UncheckedIOException exception) {
            RowValidationError fileError = new RowValidationError(0, "file", "The CSV could not be read or parsed");
            validationIssueRepository.save(issue(run, orgId, fileError));
            run.setStatus(AnalysisRunStatus.FAILED);
            run.setFailedRows(1);
            run.setCurrentStage("CSV parsing failed");
            run.setErrorMessage("The CSV could not be read or parsed");
            analysisRunRepository.save(run);
            return response(run, false, false, List.of(), List.of(fileError));
        }

        List<RowValidationError> rowErrors = new ArrayList<>(validation.getRowErrors());
        List<Charge> validCharges = new ArrayList<>();
        Set<String> lineIds = new HashSet<>();

        if (validation.areHeadersValid()) {
            for (ParsedChargeRow row : validation.getParsedRows()) {
                if (row.orgId() != null && !orgId.equals(row.orgId())) {
                    rowErrors.add(new RowValidationError(row.rowNumber(), "org_id",
                            "Row organization does not match the request organization"));
                    continue;
                }
                if (!lineIds.add(row.lineId())) {
                    rowErrors.add(new RowValidationError(row.rowNumber(), "line_id",
                            "Line ID must be unique within the uploaded report"));
                    continue;
                }
                validCharges.add(toCharge(row, run, orgId));
            }
        }

        chargeRepository.saveAll(validCharges);
        for (RowValidationError error : rowErrors) {
            validationIssueRepository.save(issue(run, orgId, error));
        }

        int invalidRows = validation.getInvalidRows() + rowErrors.size() - validation.getRowErrors().size();
        run.setTotalRows(validation.getTotalRows());
        run.setSuccessfulRows(validCharges.size());
        run.setFailedRows(invalidRows);
        run.setCurrentStage(validation.areHeadersValid() ? "Validation complete" : "CSV validation failed");
        run.setStatus(validation.areHeadersValid() ? AnalysisRunStatus.VALIDATED : AnalysisRunStatus.FAILED);
        if (!validation.areHeadersValid()) {
            run.setErrorMessage("Required CSV columns are missing");
        } else if (invalidRows > 0) {
            run.setErrorMessage("Some CSV rows were rejected; valid rows are available for analysis");
        }
        analysisRunRepository.save(run);

        return response(run, validation.areHeadersValid() && invalidRows == 0,
                validation.areHeadersValid(), validation.getMissingColumns(), rowErrors);
    }

    private Charge toCharge(ParsedChargeRow row, AnalysisRun run, String orgId) {
        Charge charge = new Charge();
        charge.setLineId(row.lineId());
        charge.setReportType(row.reportType() == null ? "fee_report" : row.reportType());
        charge.setUnitId(row.unitId());
        charge.setOrgId(orgId);
        charge.setSku(row.sku());
        charge.setFnsku(row.fnsku());
        charge.setFbaShipmentId(row.fbaShipmentId());
        charge.setShipmentId(row.fbaShipmentId());
        charge.setOrderId(row.orderId());
        charge.setChargeType(row.chargeType());
        charge.setChargeSubtype(row.chargeSubtype());
        charge.setGranularity(row.granularity());
        charge.setAsin(row.asin());
        charge.setQuantity(row.quantity());
        charge.setAmount(row.amount());
        charge.setAmountPerUnit(row.amountPerUnit());
        charge.setCurrency(row.currency());
        charge.setDescription(row.description());
        charge.setPostedDate(row.postedDate());
        charge.setChargedAt(row.postedDate());
        charge.setAnalysisRun(run);
        return charge;
    }

    private ValidationIssue issue(AnalysisRun run, String orgId, RowValidationError error) {
        ValidationIssue issue = new ValidationIssue();
        issue.setAnalysisRun(run);
        issue.setOrgId(orgId);
        issue.setRowNumber(error.getRow());
        issue.setField(error.getField());
        issue.setMessage(error.getError());
        return issue;
    }

    private UploadResponse response(
            AnalysisRun run,
            boolean valid,
            boolean headersValid,
            List<String> missingColumns,
            List<RowValidationError> rowErrors
    ) {
        return new UploadResponse(run.getAnalysisId(), run.getFileName(), run.getStatus(),
                run.getTotalRows(), run.getSuccessfulRows(), run.getFailedRows(), valid,
                headersValid, List.copyOf(missingColumns), List.copyOf(rowErrors), run.getErrorMessage());
    }

    private String safeFileName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "upload.csv";
        }
        String normalized = originalName.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }
}