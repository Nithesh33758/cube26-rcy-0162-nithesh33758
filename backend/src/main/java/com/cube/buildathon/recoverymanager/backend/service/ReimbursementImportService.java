package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.config.TenantDatabaseScope;
import com.cube.buildathon.recoverymanager.backend.dto.ParsedReimbursementRow;
import com.cube.buildathon.recoverymanager.backend.dto.ReimbursementImportResponse;
import com.cube.buildathon.recoverymanager.backend.entity.Reimbursement;
import com.cube.buildathon.recoverymanager.backend.exception.ApiException;
import com.cube.buildathon.recoverymanager.backend.repository.ReimbursementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ReimbursementImportService {
    private final ReimbursementCsvParser csvParser;
    private final ReimbursementRepository reimbursementRepository;
    private final TenantDatabaseScope tenantDatabaseScope;

    public ReimbursementImportService(
            ReimbursementCsvParser csvParser,
            ReimbursementRepository reimbursementRepository,
            TenantDatabaseScope tenantDatabaseScope
    ) {
        this.csvParser = csvParser;
        this.reimbursementRepository = reimbursementRepository;
        this.tenantDatabaseScope = tenantDatabaseScope;
    }

    @Transactional
    public ReimbursementImportResponse upload(MultipartFile file) {
        tenantDatabaseScope.applyToCurrentTransaction();
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "A non-empty reimbursement CSV is required");
        }
        String fileName = safeFileName(file.getOriginalFilename());
        if (!fileName.toLowerCase().endsWith(".csv") && !"text/csv".equalsIgnoreCase(file.getContentType())) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "INVALID_FILE_TYPE", "Only CSV files are supported");
        }

        String orgId = tenantDatabaseScope.currentOrgId();
        List<ParsedReimbursementRow> parsedRows = csvParser.parse(file);
        Set<String> idsInReport = new HashSet<>();
        for (ParsedReimbursementRow row : parsedRows) {
            if (!idsInReport.add(row.reimbursementId())
                    || reimbursementRepository.existsByOrgIdAndReimbursementId(orgId, row.reimbursementId())) {
                throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_REIMBURSEMENT",
                        "The report contains a reimbursement ID that was already imported",
                        List.of(row.reimbursementId()));
            }
        }

        List<Reimbursement> reimbursements = new ArrayList<>(parsedRows.size());
        for (ParsedReimbursementRow row : parsedRows) {
            reimbursements.add(toEntity(row, orgId));
        }
        reimbursementRepository.saveAllAndFlush(reimbursements);
        return new ReimbursementImportResponse(fileName, reimbursements.size());
    }

    private Reimbursement toEntity(ParsedReimbursementRow row, String orgId) {
        Reimbursement reimbursement = new Reimbursement();
        reimbursement.setOrgId(orgId);
        reimbursement.setReimbursementId(row.reimbursementId());
        reimbursement.setCaseId(row.caseId());
        reimbursement.setApprovalDate(row.approvalDate());
        reimbursement.setAmazonOrderId(row.amazonOrderId());
        reimbursement.setSku(row.sku());
        reimbursement.setFnsku(row.fnsku());
        reimbursement.setAsin(row.asin());
        reimbursement.setReason(row.reason());
        reimbursement.setCondition(row.condition());
        reimbursement.setCurrency(row.currency());
        reimbursement.setAmountPerUnit(row.amountPerUnit());
        reimbursement.setAmountTotal(row.amountTotal());
        reimbursement.setQuantityReimbursedCash(row.quantityReimbursedCash());
        reimbursement.setQuantityReimbursedInventory(row.quantityReimbursedInventory());
        reimbursement.setOriginalReimbursementId(row.originalReimbursementId());
        return reimbursement;
    }

    private String safeFileName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "reimbursements.csv";
        }
        String normalized = originalName.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }
}