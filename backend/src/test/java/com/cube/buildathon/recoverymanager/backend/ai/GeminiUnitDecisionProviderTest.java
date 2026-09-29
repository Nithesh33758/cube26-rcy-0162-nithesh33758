package com.cube.buildathon.recoverymanager.backend.ai;

import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.service.DecisionSuggestion;
import com.cube.buildathon.recoverymanager.backend.service.UnitAnalysisContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiUnitDecisionProviderTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void missingApiKeyFailsOpenWithoutCallingGemini() {
        GeminiUnitDecisionProvider provider = new GeminiUnitDecisionProvider(objectMapper, "", "gemini-3.8-flash");

        Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context("PASS", "2026-08-31T10:00:00Z"));

        assertThat(provider.isConfigured()).isFalse();
        assertThat(decisions.get("CHG-1").decision()).isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
    }

    @Test
    void acceptsOnlyCitedPassEvidenceAndRulesThatPredateTheCharge() throws Exception {
        GeminiUnitDecisionProvider provider = new GeminiUnitDecisionProvider(objectMapper, "test-key", "gemini-3.8-flash");
        String json = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Prep check passed.",
                "evidenceRecordIds":["E-1"],"requirementIds":[7]}]}
                """;

        Map<String, DecisionSuggestion> decisions = provider.parseDecisionJson(json, context("PASS", "2026-08-31T10:00:00Z"));

        assertThat(decisions.get("CHG-1").decision()).isEqualTo(DecisionType.CONTESTED);
        assertThat(decisions.get("CHG-1").reason()).contains("E-1", "Rule refs: 7");
    }

    @Test
    void rejectsUnsupportedVerdictsUnknownCitationsAndEvidenceAfterCharge() throws Exception {
        GeminiUnitDecisionProvider provider = new GeminiUnitDecisionProvider(objectMapper, "test-key", "gemini-3.8-flash");
        String unsupported = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"already_reimbursed","reason":"Paid.",
                "evidenceRecordIds":["E-1"],"requirementIds":[7]}]}
                """;
        String unknownCitation = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Pass.",
                "evidenceRecordIds":["NOT-IN-CONTEXT"],"requirementIds":[7]}]}
                """;
        String evidenceAfterCharge = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Pass.",
                "evidenceRecordIds":["E-1"],"requirementIds":[7]}]}
                """;

        assertThat(provider.parseDecisionJson(unsupported, context("PASS", "2026-08-31T10:00:00Z"))
                .get("CHG-1").decision()).isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
        assertThat(provider.parseDecisionJson(unknownCitation, context("PASS", "2026-08-31T10:00:00Z"))
                .get("CHG-1").decision()).isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
        assertThat(provider.parseDecisionJson(evidenceAfterCharge, context("PASS", "2026-09-02T10:00:00Z"))
                .get("CHG-1").decision()).isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
    }

    @Test
    void requiresFailedEvidenceForAcceptedVerdict() throws Exception {
        GeminiUnitDecisionProvider provider = new GeminiUnitDecisionProvider(objectMapper, "test-key", "gemini-3.8-flash");
        String json = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"accepted","reason":"Check passed.",
                "evidenceRecordIds":["E-1"],"requirementIds":[7]}]}
                """;

        assertThat(provider.parseDecisionJson(json, context("PASS", "2026-08-31T10:00:00Z"))
                .get("CHG-1").decision()).isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
    }

    @Test
    void rejectsRulesForAnotherChargeType() throws Exception {
        GeminiUnitDecisionProvider provider = new GeminiUnitDecisionProvider(objectMapper, "test-key", "gemini-3.8-flash");
        String json = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Prep check passed.",
                "evidenceRecordIds":["E-1"],"requirementIds":[7]}]}
                """;

        assertThat(provider.parseDecisionJson(json, context("PASS", "2026-08-31T10:00:00Z", "lost_inbound"))
                .get("CHG-1").decision()).isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
    }

    private UnitAnalysisContext context(String evidenceStatus, String timestamp) {
                return context(evidenceStatus, timestamp, "inbound_defect");
        }

        private UnitAnalysisContext context(String evidenceStatus, String timestamp, String requirementChargeType) {
        UnitAnalysisContext.ChargeInput charge = new UnitAnalysisContext.ChargeInput(
                "CHG-1", "inbound_defect", 1, new BigDecimal("5.00"), LocalDate.parse("2026-09-01"),
                "SKU-1", "FNSKU-1", "FBA-1", "ORD-1", "unbagged_unit", "unit", "FBA-1",
                "ASIN-1", "USD", new BigDecimal("5.00"), "Inbound defect fee", LocalDate.parse("2026-09-01"));
        UnitAnalysisContext.EvidenceInput evidence = new UnitAnalysisContext.EvidenceInput(
                "E-1", EvidenceSourceType.PREP, "polybag_present", evidenceStatus,
                "A polybag is present", Instant.parse(timestamp), null);
        UnitAnalysisContext.RequirementInput requirement = new UnitAnalysisContext.RequirementInput(
                7L, "Bagging requirement", "Unit must be bagged", requirementChargeType, "policy: polybag required");
        return new UnitAnalysisContext("org_demo_alpha", "UNIT-1", List.of(charge), List.of(evidence), List.of(requirement));
    }
}