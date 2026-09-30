package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.config.TenantDatabaseScope;
import com.cube.buildathon.recoverymanager.backend.dto.EvidenceImportResponse;
import com.cube.buildathon.recoverymanager.backend.entity.Evidence;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.exception.ApiException;
import com.cube.buildathon.recoverymanager.backend.repository.EvidenceRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class EvidenceImportService {
    private final EvidenceRepository evidenceRepository;
    private final TenantDatabaseScope tenantDatabaseScope;

    public EvidenceImportService(EvidenceRepository evidenceRepository, TenantDatabaseScope tenantDatabaseScope) {
        this.evidenceRepository = evidenceRepository;
        this.tenantDatabaseScope = tenantDatabaseScope;
    }

    @Transactional
    public EvidenceImportResponse importCsv(MultipartFile file, EvidenceSourceType sourceType) {
        tenantDatabaseScope.applyToCurrentTransaction();
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "A non-empty evidence CSV is required");
        }
        if (sourceType == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SOURCE_TYPE_REQUIRED",
                    "sourceType must be RECEIVING, PREP, PACK, or RETURNS");
        }

        String orgId = tenantDatabaseScope.currentOrgId();
        List<Evidence> imported = new ArrayList<>();
        int checkCount = 0;
        try (CSVParser parser = CSVParser.parse(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8,
                CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreEmptyLines(true).setTrim(true).build())) {
            for (CSVRecord row : parser) {
                String rowOrgId = value(row, "org_id");
                if (!orgId.equals(rowOrgId)) {
                    continue;
                }
                String recordId = required(row, "record_id");
                String unitId = required(row, "unit_id");
                if (evidenceRepository.existsByOrgIdAndRecordId(orgId, recordId)) {
                    continue;
                }
                for (Map.Entry<String, String> check : checks(row, sourceType).entrySet()) {
                    Evidence evidence = new Evidence();
                    evidence.setOrgId(orgId);
                    evidence.setUnitId(unitId);
                    evidence.setRecordId(recordId + ":" + check.getKey());
                    evidence.setSourceType(sourceType);
                    evidence.setRequirement(check.getKey());
                    evidence.setStatus(status(check.getValue()));
                    evidence.setFinding("Fixture value for " + check.getKey() + ": "
                            + (check.getValue() == null || check.getValue().isBlank() ? "missing" : check.getValue()));
                    evidence.setTimestamp(parseTimestamp(value(row, "captured_at")));
                    evidence.setMetadataJson("{\"fixtureRecordId\":\"" + recordId + "\"}");
                    imported.add(evidence);
                    checkCount++;
                }
            }
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_EVIDENCE_CSV",
                    "The evidence CSV could not be read");
        }
        evidenceRepository.saveAllAndFlush(imported);
        return new EvidenceImportResponse(sourceType.name(), safeFileName(file.getOriginalFilename()),
                imported.stream().map(item -> item.getRecordId().split(":", 2)[0]).distinct().toList().size(), checkCount);
    }

    private Map<String, String> checks(CSVRecord row, EvidenceSourceType sourceType) {
        Map<String, String> checks = new LinkedHashMap<>();
        switch (sourceType) {
            case RECEIVING -> {
                checks.put("identity_matches_po", value(row, "identity_match"));
                checks.put("quantity_matches_po", equal(value(row, "qty_ordered"), value(row, "qty_received")) ? "yes" : "no");
                checks.put("carton_undamaged", "none".equalsIgnoreCase(value(row, "carton_damage")) ? "yes" : "no");
                checks.put("unit_undamaged", "none".equalsIgnoreCase(value(row, "unit_damage")) ? "yes" : "no");
            }
            case PREP -> {
                checks.put("polybag_present", value(row, "polybag_present_sealed"));
                checks.put("polybag_sealed", value(row, "polybag_present_sealed"));
                checks.put("suffocation_warning_present", value(row, "suffocation_warning"));
                checks.put("suffocation_warning_legible", value(row, "suffocation_warning"));
                checks.put("fnsku_label_flat", value(row, "fnsku_label_placement"));
                checks.put("fnsku_label_placement_valid", value(row, "fnsku_label_placement"));
                checks.put("manufacturer_barcode_covered", value(row, "original_barcode_covered"));
            }
            case PACK -> {
                String matches = equal(value(row, "order_lines"), value(row, "observed_in_box")) ? "yes" : "no";
                checks.put("all_items_present", matches);
                checks.put("quantities_correct", matches);
                checks.put("order_matches_manifest", value(row, "operator_verdict"));
            }
            case RETURNS -> {
                checks.put("identity_matches_order", value(row, "identity_match"));
                checks.put("completeness_verified", blank(value(row, "parts_missing")) ? "yes" : "no");
                checks.put("condition_grade", value(row, "amazon_condition"));
                checks.put("disposition_assigned", value(row, "operator_disposition"));
            }
        }
        return checks;
    }

    private String status(String value) {
        if (value == null) return "UNCERTAIN";
        return switch (value.trim().toLowerCase()) {
            case "yes", "true", "present", "sealed", "legible", "flat", "on_seam", "all_present", "restock", "not_required" -> "PASS";
            case "no", "false", "none", "not_sealed", "missing", "uncertain", "liquidate", "dispose" -> "FAIL";
            default -> "UNCERTAIN";
        };
    }

    private String required(CSVRecord row, String field) {
        String value = value(row, field);
        if (value == null) throw new IllegalArgumentException("Missing " + field);
        return value;
    }

    private String value(CSVRecord row, String field) {
        return row.isMapped(field) && !row.get(field).isBlank() ? row.get(field).trim() : null;
    }

    private boolean equal(String left, String right) {
        return left != null && left.equals(right);
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }

    private Instant parseTimestamp(String value) { return value == null ? null : Instant.parse(value); }

    private String safeFileName(String name) {
        if (name == null || name.isBlank()) return "evidence.csv";
        String normalized = name.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }
}