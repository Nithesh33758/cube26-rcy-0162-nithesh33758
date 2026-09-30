package com.cube.buildathon.recoverymanager.backend.ai;

import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.service.DecisionSuggestion;
import com.cube.buildathon.recoverymanager.backend.service.UnitAnalysisContext;
import com.cube.buildathon.recoverymanager.backend.service.UnitDecisionProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Rule-based decision engine that evaluates charges against upstream evidence
 * using deterministic logic. Replaces the unreliable small-LLM approach with
 * direct evidence-to-charge reasoning based on Amazon FBA recovery rules.
 *
 * Decision logic per charge type:
 * - inbound_defect_fee:  CONTESTED if prep evidence (FNSKU, polybag, barcode) all PASS before charge date
 * - lost_inbound:        CONTESTED if receiving shows quantity match (PASS); ACCEPTED if quantity mismatch (FAIL)
 * - damaged_in_warehouse: CONTESTED if receiving shows unit undamaged (PASS) at receipt
 * - refund_issued_item_not_returned: CONTESTED if returns show completeness PASS; ACCEPTED if completeness FAIL
 * - fulfilment_fee_weight_tier: CONTESTED if prep/receiving show packaging compliance (PASS)
 */
@Service
@Primary
public class RuleBasedDecisionProvider implements UnitDecisionProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(RuleBasedDecisionProvider.class);

    private static final String INSUFFICIENT_REASON =
            "No applicable evidence or rules available for this charge; manual review is required.";

    // Evidence check keys per charge type for CONTESTED verdicts (all must be PASS)
    private static final Map<String, List<String>> CONTESTED_CHECKS = Map.of(
            "inbound_defect_fee", List.of("fnsku_label_flat", "manufacturer_barcode_covered"),
            "lost_inbound", List.of("quantity_matches_po"),
            "damaged_in_warehouse", List.of("unit_undamaged"),
            "refund_issued_item_not_returned", List.of("identity_matches_order", "completeness_verified"),
            "fulfilment_fee_weight_tier", List.of("fnsku_label_flat")
    );

    // Evidence check keys per charge type for ACCEPTED verdicts (any must be FAIL)
    private static final Map<String, List<String>> ACCEPTED_CHECKS = Map.of(
            "inbound_defect_fee", List.of("fnsku_label_flat", "manufacturer_barcode_covered", "polybag_present"),
            "lost_inbound", List.of("quantity_matches_po"),
            "damaged_in_warehouse", List.of("unit_undamaged", "carton_undamaged"),
            "refund_issued_item_not_returned", List.of("completeness_verified", "condition_grade", "identity_matches_order"),
            "fulfilment_fee_weight_tier", List.of("fnsku_label_flat", "unit_undamaged")
    );

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public Map<String, DecisionSuggestion> analyzeUnit(UnitAnalysisContext context) {
        Map<String, DecisionSuggestion> decisions = new LinkedHashMap<>();

        // Build evidence lookup: requirement (check key) -> list of evidence items
        Map<String, List<UnitAnalysisContext.EvidenceInput>> evidenceByCheck = new LinkedHashMap<>();
        for (UnitAnalysisContext.EvidenceInput item : context.evidence()) {
            if (item.requirement() != null) {
                evidenceByCheck.computeIfAbsent(item.requirement(), k -> new ArrayList<>()).add(item);
            }
        }

        // Build requirement lookup: chargeType -> list of requirements
        Map<String, List<UnitAnalysisContext.RequirementInput>> rulesByChargeType = context.requirements().stream()
                .filter(r -> r.chargeType() != null && r.rule() != null && !r.rule().isBlank())
                .collect(Collectors.groupingBy(r -> r.chargeType().toLowerCase()));

        for (UnitAnalysisContext.ChargeInput charge : context.charges()) {
            String chargeType = charge.chargeType() == null ? "" : charge.chargeType().toLowerCase();
            LocalDate chargeDate = charge.chargedAt() != null ? charge.chargedAt() : charge.postedDate();

            List<UnitAnalysisContext.RequirementInput> applicableRules =
                    rulesByChargeType.getOrDefault(chargeType, List.of());

            if (applicableRules.isEmpty() && context.evidence().isEmpty()) {
                decisions.put(charge.lineId(), new DecisionSuggestion(
                        DecisionType.UNCERTAIN, INSUFFICIENT_REASON));
                continue;
            }

            // Try CLAIM first: all required checks must be PASS and predate the charge
            DecisionSuggestion suggestion = tryContested(charge, chargeType, chargeDate,
                    evidenceByCheck, applicableRules);
            if (suggestion != null) {
                decisions.put(charge.lineId(), suggestion);
                LOGGER.info("Unit {} charge {} -> CLAIM", context.unitId(), charge.lineId());
                continue;
            }

            // Try REJECT: any required check is FAIL
            suggestion = tryAccepted(charge, chargeType, chargeDate, evidenceByCheck, applicableRules);
            if (suggestion != null) {
                decisions.put(charge.lineId(), suggestion);
                LOGGER.info("Unit {} charge {} -> REJECT", context.unitId(), charge.lineId());
                continue;
            }

            // Default: UNCERTAIN
            String reason = buildInsufficientReason(chargeType, evidenceByCheck);
            decisions.put(charge.lineId(), new DecisionSuggestion(DecisionType.UNCERTAIN, reason));
            LOGGER.info("Unit {} charge {} -> UNCERTAIN", context.unitId(), charge.lineId());
        }

        return decisions;
    }

    private DecisionSuggestion tryContested(
            UnitAnalysisContext.ChargeInput charge,
            String chargeType,
            LocalDate chargeDate,
            Map<String, List<UnitAnalysisContext.EvidenceInput>> evidenceByCheck,
            List<UnitAnalysisContext.RequirementInput> applicableRules
    ) {
        List<String> requiredChecks = CONTESTED_CHECKS.get(chargeType);
        if (requiredChecks == null || requiredChecks.isEmpty()) {
            return null;
        }

        List<String> citedEvidenceIds = new ArrayList<>();
        List<String> passedCheckNames = new ArrayList<>();

        for (String checkKey : requiredChecks) {
            List<UnitAnalysisContext.EvidenceInput> items = evidenceByCheck.getOrDefault(checkKey, List.of());
            UnitAnalysisContext.EvidenceInput passItem = items.stream()
                    .filter(this::isPass)
                    .filter(e -> evidencePredatesCharge(e, chargeDate))
                    .findFirst().orElse(null);
            if (passItem == null) {
                return null; // At least one required check is not PASS -> can't contest
            }
            citedEvidenceIds.add(passItem.recordId());
            passedCheckNames.add(checkKey);
        }

        List<Long> ruleIds = applicableRules.stream()
                .map(UnitAnalysisContext.RequirementInput::id).toList();

        String reason = buildContestedReason(chargeType, passedCheckNames);
        String citations = " Evidence refs: " + String.join(", ", citedEvidenceIds) + ".";
        if (!ruleIds.isEmpty()) {
            citations += " Rule refs: " + ruleIds.stream().map(String::valueOf)
                    .collect(Collectors.joining(", ")) + ".";
        }

        return new DecisionSuggestion(DecisionType.CLAIM, limitReason(reason + citations));
    }

    private DecisionSuggestion tryAccepted(
            UnitAnalysisContext.ChargeInput charge,
            String chargeType,
            LocalDate chargeDate,
            Map<String, List<UnitAnalysisContext.EvidenceInput>> evidenceByCheck,
            List<UnitAnalysisContext.RequirementInput> applicableRules
    ) {
        List<String> acceptChecks = ACCEPTED_CHECKS.get(chargeType);
        if (acceptChecks == null || acceptChecks.isEmpty()) {
            return null;
        }

        List<String> citedEvidenceIds = new ArrayList<>();
        List<String> failedCheckNames = new ArrayList<>();

        for (String checkKey : acceptChecks) {
            List<UnitAnalysisContext.EvidenceInput> items = evidenceByCheck.getOrDefault(checkKey, List.of());
            UnitAnalysisContext.EvidenceInput failItem = items.stream()
                    .filter(this::isFail)
                    .findFirst().orElse(null);
            if (failItem != null) {
                citedEvidenceIds.add(failItem.recordId());
                failedCheckNames.add(checkKey);
            }
        }

        if (citedEvidenceIds.isEmpty()) {
            return null; // No FAIL evidence found -> can't accept
        }

        List<Long> ruleIds = applicableRules.stream()
                .map(UnitAnalysisContext.RequirementInput::id).toList();

        String reason = buildAcceptedReason(chargeType, failedCheckNames);
        String citations = " Evidence refs: " + String.join(", ", citedEvidenceIds) + ".";
        if (!ruleIds.isEmpty()) {
            citations += " Rule refs: " + ruleIds.stream().map(String::valueOf)
                    .collect(Collectors.joining(", ")) + ".";
        }

        return new DecisionSuggestion(DecisionType.REJECT, limitReason(reason + citations));
    }

    private boolean isPass(UnitAnalysisContext.EvidenceInput e) {
        if ("PASS".equalsIgnoreCase(e.status())) {
            return true;
        }
        if (e.finding() != null) {
            String lower = e.finding().toLowerCase();
            if (("unit_undamaged".equalsIgnoreCase(e.requirement()) || "carton_undamaged".equalsIgnoreCase(e.requirement()))
                    && (lower.contains(": none") || lower.contains(": yes"))) {
                return true;
            }
            if (lower.contains("not_required") || lower.contains("all_present") || lower.contains(": flat")) {
                return true;
            }
        }
        return false;
    }

    private boolean isFail(UnitAnalysisContext.EvidenceInput e) {
        if (e.finding() != null) {
            String lower = e.finding().toLowerCase();
            if (("unit_undamaged".equalsIgnoreCase(e.requirement()) || "carton_undamaged".equalsIgnoreCase(e.requirement()))
                    && lower.contains(": none")) {
                return false;
            }
            if (lower.contains("not_required")) {
                return false;
            }
        }
        if ("FAIL".equalsIgnoreCase(e.status())) {
            return true;
        }
        if (e.finding() != null) {
            String lower = e.finding().toLowerCase();
            if (lower.contains("crushing") || lower.contains("tears") || lower.contains("missing")
                    || lower.contains("liquidate") || lower.contains("dispose") || lower.contains("on_curve")
                    || lower.contains("on_seam") || lower.contains(": no") || lower.contains("mismatch")
                    || lower.contains("wrong_colour") || lower.contains("obvious_defect")) {
                return true;
            }
        }
        return false;
    }

    private boolean evidencePredatesCharge(UnitAnalysisContext.EvidenceInput evidence, LocalDate chargeDate) {
        if (chargeDate == null || evidence.timestamp() == null) {
            return true; // Lenient: if dates are missing, don't block the decision
        }
        LocalDate evidenceDate = evidence.timestamp().atZone(ZoneOffset.UTC).toLocalDate();
        return !evidenceDate.isAfter(chargeDate);
    }

    private String buildContestedReason(String chargeType, List<String> passedChecks) {
        return switch (chargeType) {
            case "inbound_defect_fee" ->
                    "Claim recommended. Prep evidence confirms packaging and labeling compliance prior to charge date. Fee appears erroneous.";
            case "lost_inbound" ->
                    "Claim recommended. Receiving evidence confirms shipped quantity matched received quantity. Adjustment appears to be an error.";
            case "damaged_in_warehouse" ->
                    "Claim recommended. Receiving evidence confirms unit was undamaged at receipt. Damage occurred while in Amazon warehouse custody.";
            case "refund_issued_item_not_returned" ->
                    "Claim recommended. Returns evidence confirms item identity and completeness were verified in acceptable condition.";
            case "fulfilment_fee_weight_tier" ->
                    "Claim recommended. Packaging and prep evidence confirm compliance with Amazon packaging tier guidelines.";
            default -> "Claim recommended. Evidence supports recovery claim based on passed checks: " + String.join(", ", passedChecks) + ".";
        };
    }

    private String buildAcceptedReason(String chargeType, List<String> failedChecks) {
        return switch (chargeType) {
            case "inbound_defect_fee" ->
                    "Reject dispute. Prep evidence indicates packaging or labeling defect (" + String.join(", ", failedChecks) + "). Fee is legitimate.";
            case "lost_inbound" ->
                    "Reject dispute. Receiving evidence confirms shipped quantity did NOT match received quantity. Shortage is valid.";
            case "damaged_in_warehouse" ->
                    "Reject dispute. Receiving evidence shows unit or carton was damaged upon receipt. Damage charge is justified.";
            case "refund_issued_item_not_returned" ->
                    "Reject dispute. Returns evidence indicates item was missing parts or not returned (" + String.join(", ", failedChecks) + ").";
            case "fulfilment_fee_weight_tier" ->
                    "Reject dispute. Prep or receiving evidence indicates packaging non-compliance. Fee tier is justified.";
            default -> "Reject dispute. Evidence confirms deficiency: " + String.join(", ", failedChecks) + ".";
        };
    }

    private String buildInsufficientReason(String chargeType, Map<String, List<UnitAnalysisContext.EvidenceInput>> evidenceByCheck) {
        List<String> requiredChecks = CONTESTED_CHECKS.getOrDefault(chargeType, List.of());
        if (requiredChecks.isEmpty()) {
            return "Uncertain. No decision rules configured for charge type '" + chargeType + "'; manual review required.";
        }

        List<String> missing = new ArrayList<>();
        List<String> uncertain = new ArrayList<>();
        for (String check : requiredChecks) {
            List<UnitAnalysisContext.EvidenceInput> items = evidenceByCheck.getOrDefault(check, List.of());
            if (items.isEmpty()) {
                missing.add(check);
            } else if (items.stream().noneMatch(this::isPass) && items.stream().noneMatch(this::isFail)) {
                uncertain.add(check);
            }
        }

        StringBuilder reason = new StringBuilder("Uncertain. Manual review required. ");
        if (!missing.isEmpty()) {
            reason.append("Missing upstream evidence for: ").append(String.join(", ", missing)).append(". ");
        }
        if (!uncertain.isEmpty()) {
            reason.append("Inconclusive evidence for: ").append(String.join(", ", uncertain)).append(". ");
        }
        if (missing.isEmpty() && uncertain.isEmpty()) {
            reason.append("Evidence is present but inconclusive.");
        }
        return reason.toString().trim();
    }

    private String limitReason(String reason) {
        return reason.length() <= 1900 ? reason : reason.substring(0, 1900);
    }
}
