package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.config.TenantDatabaseScope;
import com.cube.buildathon.recoverymanager.backend.entity.Evidence;
import com.cube.buildathon.recoverymanager.backend.entity.Requirement;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.repository.EvidenceRepository;
import com.cube.buildathon.recoverymanager.backend.repository.RequirementRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@Order(2)
public class DefaultDataBootstrap implements ApplicationRunner {
    private static final List<String> ORG_IDS = List.of("org_demo_alpha", "org_demo_bravo");
    private static final Map<String, RequirementSpec> REQUIREMENT_SPECS = Map.of(
            "inbound_defect_fee", new RequirementSpec(
                    "Inbound defect review",
                    "Working assumption: contest an inbound defect when matching prep evidence predates the charge and the unit can be matched to the shipment.",
                    "Working assumption only: contest an inbound defect when prep evidence before the charge, shipment validation, and matching unit evidence support the dispute. This is demo logic until the current Amazon Seller Central policy is verified."),
            "lost_inbound", new RequirementSpec(
                    "Lost inbound review",
                    "Working assumption: a lost-inbound charge is contestable only when the shipment can be reconciled to the received quantity and ownership evidence is present.",
                    "Working assumption only: a lost-inbound claim needs shipment identity, delivered quantities, and reconciliation to the receiving record. Conflicting claim windows remain conservative and should be reviewed manually."),
            "damaged_in_warehouse", new RequirementSpec(
                    "Warehouse damage review",
                    "Working assumption: warehouse damage can be contested when the item was undamaged on receipt and the damage occurred while Amazon held the unit.",
                    "Working assumption only: warehouse damage is contestable when receiving evidence shows the unit was undamaged at receipt and the damage occurred in Amazon possession. Confirm current policy before relying on the result."),
            "refund_issued_item_not_returned", new RequirementSpec(
                    "Customer return reimbursement review",
                    "Working assumption: a refund issued without a returned item may be valid when the order, refund date, and return evidence can be matched.",
                    "Working assumption only: a returned-item reimbursement can be considered when the customer refund date, order identity, and return records support a missing-return claim. Verify the current claim window before filing."),
            "fulfilment_fee_weight_tier", new RequirementSpec(
                    "FBA fulfilment fee weight tier review",
                    "Working assumption: contest a fulfilment fee weight tier discrepancy when packaging and prep checks pass and predate the charge.",
                    "Working assumption only: contest fulfilment fee weight tier discrepancy when packaging and prep evidence confirm compliance with tier guidelines and predate the charge.")
    );

    private final RequirementRepository requirementRepository;
    private final EvidenceRepository evidenceRepository;
    private final TenantDatabaseScope tenantDatabaseScope;

    public DefaultDataBootstrap(
            RequirementRepository requirementRepository,
            EvidenceRepository evidenceRepository,
            TenantDatabaseScope tenantDatabaseScope
    ) {
        this.requirementRepository = requirementRepository;
        this.evidenceRepository = evidenceRepository;
        this.tenantDatabaseScope = tenantDatabaseScope;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRequirements();
        if (evidenceRepository.count() == 0) {
            seedEvidence();
        }
    }

    private void seedRequirements() {
        for (String orgId : ORG_IDS) {
            tenantDatabaseScope.applyToOrg(orgId);

            List<String> chargeTypes = new ArrayList<>(REQUIREMENT_SPECS.keySet());
            List<Requirement> existing = requirementRepository.findByOrgIdAndActiveTrueAndChargeTypeIn(orgId, chargeTypes);
            Set<String> existingTypes = existing.stream().map(Requirement::getChargeType).collect(java.util.stream.Collectors.toSet());

            List<Requirement> toSave = new ArrayList<>();
            for (Map.Entry<String, RequirementSpec> entry : REQUIREMENT_SPECS.entrySet()) {
                String chargeType = entry.getKey();
                if (existingTypes.contains(chargeType)) {
                    continue;
                }
                Requirement requirement = new Requirement();
                requirement.setOrgId(orgId);
                requirement.setName(entry.getValue().name());
                requirement.setDescription(entry.getValue().description());
                requirement.setChargeType(chargeType);
                requirement.setRule(entry.getValue().rule());
                requirement.setActive(true);
                toSave.add(requirement);
            }
            if (!toSave.isEmpty()) {
                requirementRepository.saveAll(toSave);
                requirementRepository.flush();
            }
        }
    }

    private void seedEvidence() {
        Map<EvidenceSourceType, Path> files = Map.of(
                EvidenceSourceType.RECEIVING, resolve("data/upstream/receiving_sample.csv"),
                EvidenceSourceType.PREP, resolve("data/upstream/prep_sample.csv"),
                EvidenceSourceType.PACK, resolve("data/upstream/pack_sample.csv"),
                EvidenceSourceType.RETURNS, resolve("data/upstream/returns_sample.csv"));

        for (String orgId : ORG_IDS) {
            tenantDatabaseScope.applyToOrg(orgId);

            List<Evidence> imported = new ArrayList<>();
            for (Map.Entry<EvidenceSourceType, Path> entry : files.entrySet()) {
                if (!Files.exists(entry.getValue())) {
                    continue;
                }
                try (CSVParser parser = CSVParser.parse(Files.newInputStream(entry.getValue()), StandardCharsets.UTF_8,
                        CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreEmptyLines(true).setTrim(true).build())) {
                    for (CSVRecord row : parser) {
                        String rowOrgId = value(row, "org_id");
                        if (rowOrgId == null || !orgId.equals(rowOrgId)) {
                            continue;
                        }
                        String recordId = value(row, "record_id");
                        String unitId = value(row, "unit_id");
                        if (recordId == null || unitId == null) {
                            continue;
                        }
                        for (Map.Entry<String, String> check : checks(row, entry.getKey()).entrySet()) {
                            Evidence evidence = new Evidence();
                            evidence.setOrgId(orgId);
                            evidence.setUnitId(unitId);
                            evidence.setRecordId(recordId + ":" + check.getKey());
                            evidence.setSourceType(entry.getKey());
                            evidence.setRequirement(check.getKey());
                            evidence.setStatus(status(check.getValue()));
                            evidence.setFinding("Fixture value for " + check.getKey() + ": " + (check.getValue() == null || check.getValue().isBlank() ? "missing" : check.getValue()));
                            evidence.setTimestamp(parseTimestamp(value(row, "captured_at")));
                            evidence.setMetadataJson("{\"fixtureRecordId\":\"" + recordId + "\"}");
                            imported.add(evidence);
                        }
                    }
                } catch (IOException ignored) {
                    // Swallow bootstrap failures; the app can still operate in a conservative mode.
                }
            }

            if (!imported.isEmpty()) {
                evidenceRepository.saveAll(imported);
                evidenceRepository.flush();
            }
        }
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

    private String value(CSVRecord row, String field) {
        return row.isMapped(field) && !row.get(field).isBlank() ? row.get(field).trim() : null;
    }

    private boolean equal(String left, String right) {
        return left != null && left.equals(right);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private Instant parseTimestamp(String value) {
        if (value == null) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Path resolve(String relativePath) {
        Path projectRoot = Path.of(System.getProperty("user.dir"));
        Path direct = projectRoot.resolve(relativePath);
        if (Files.exists(direct)) {
            return direct;
        }
        Path parent = projectRoot.resolve("..").resolve(relativePath);
        if (Files.exists(parent)) {
            return parent;
        }
        Path grandParent = projectRoot.resolve("../..").resolve(relativePath);
        if (Files.exists(grandParent)) {
            return grandParent;
        }
        return parent;
    }

    private record RequirementSpec(String name, String description, String rule) {
    }
}
