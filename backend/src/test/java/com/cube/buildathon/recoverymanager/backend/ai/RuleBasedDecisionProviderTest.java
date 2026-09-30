package com.cube.buildathon.recoverymanager.backend.ai;

import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.service.DecisionSuggestion;
import com.cube.buildathon.recoverymanager.backend.service.UnitAnalysisContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RuleBasedDecisionProviderTest {

    private RuleBasedDecisionProvider provider;

    @BeforeEach
    void setUp() {
        provider = new RuleBasedDecisionProvider();
    }

    private UnitAnalysisContext.ChargeInput createCharge(String lineId, String chargeType, LocalDate date) {
        return new UnitAnalysisContext.ChargeInput(
                lineId, chargeType, 1, BigDecimal.TEN, date,
                "SKU-1", "X001", "FBA-1", "ORD-1", null, "unit",
                "FBA-1", "ASIN-1", "USD", BigDecimal.TEN, "desc", date
        );
    }

    @Test
    void lostInboundContestedWhenQuantityMatches() {
        UnitAnalysisContext context = new UnitAnalysisContext(
                "org_demo_alpha",
                "UNIT-0001",
                List.of(createCharge("CHG-1", "lost_inbound", LocalDate.of(2026, 7, 1))),
                List.of(new UnitAnalysisContext.EvidenceInput(
                        "RCV-0001:quantity_matches_po", EvidenceSourceType.RECEIVING,
                        "quantity_matches_po", "PASS", "qty matches",
                        Instant.parse("2026-06-04T12:00:00Z"), "{}"
                )),
                List.of(new UnitAnalysisContext.RequirementInput(
                        1L, "lost inbound", "desc", "lost_inbound", "rule"
                ))
        );

        Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context);
        assertEquals(1, decisions.size());
        DecisionSuggestion suggestion = decisions.get("CHG-1");
        assertNotNull(suggestion);
        assertEquals(DecisionType.CLAIM, suggestion.decision());
        assertTrue(suggestion.reason().contains("Evidence refs: RCV-0001:quantity_matches_po"));
    }

    @Test
    void lostInboundAcceptedWhenQuantityShortage() {
        UnitAnalysisContext context = new UnitAnalysisContext(
                "org_demo_alpha",
                "UNIT-0003",
                List.of(createCharge("CHG-2", "lost_inbound", LocalDate.of(2026, 7, 1))),
                List.of(new UnitAnalysisContext.EvidenceInput(
                        "RCV-0003:quantity_matches_po", EvidenceSourceType.RECEIVING,
                        "quantity_matches_po", "FAIL", "qty shortage",
                        Instant.parse("2026-06-04T12:00:00Z"), "{}"
                )),
                List.of(new UnitAnalysisContext.RequirementInput(
                        1L, "lost inbound", "desc", "lost_inbound", "rule"
                ))
        );

        Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context);
        assertEquals(1, decisions.size());
        DecisionSuggestion suggestion = decisions.get("CHG-2");
        assertNotNull(suggestion);
        assertEquals(DecisionType.REJECT, suggestion.decision());
        assertTrue(suggestion.reason().contains("Evidence refs: RCV-0003:quantity_matches_po"));
    }

    @Test
    void warehouseDamageContestedWhenUndamagedOnReceipt() {
        UnitAnalysisContext context = new UnitAnalysisContext(
                "org_demo_alpha",
                "UNIT-0001",
                List.of(createCharge("CHG-3", "damaged_in_warehouse", LocalDate.of(2026, 7, 1))),
                List.of(new UnitAnalysisContext.EvidenceInput(
                        "RCV-0001:unit_undamaged", EvidenceSourceType.RECEIVING,
                        "unit_undamaged", "PASS", "Fixture value for unit_undamaged: none",
                        Instant.parse("2026-06-04T12:00:00Z"), "{}"
                )),
                List.of()
        );

        Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context);
        assertEquals(1, decisions.size());
        DecisionSuggestion suggestion = decisions.get("CHG-3");
        assertNotNull(suggestion);
        assertEquals(DecisionType.CLAIM, suggestion.decision());
    }

    @Test
    void inboundDefectContestedWhenPrepChecksPass() {
        UnitAnalysisContext context = new UnitAnalysisContext(
                "org_demo_alpha",
                "UNIT-0007",
                List.of(createCharge("CHG-4", "inbound_defect_fee", LocalDate.of(2026, 7, 1))),
                List.of(
                        new UnitAnalysisContext.EvidenceInput(
                                "PRP-0007:fnsku_label_flat", EvidenceSourceType.PREP,
                                "fnsku_label_flat", "PASS", "flat",
                                Instant.parse("2026-06-04T12:00:00Z"), "{}"
                        ),
                        new UnitAnalysisContext.EvidenceInput(
                                "PRP-0007:manufacturer_barcode_covered", EvidenceSourceType.PREP,
                                "manufacturer_barcode_covered", "PASS", "yes",
                                Instant.parse("2026-06-04T12:00:00Z"), "{}"
                        )
                ),
                List.of()
        );

        Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context);
        assertEquals(1, decisions.size());
        DecisionSuggestion suggestion = decisions.get("CHG-4");
        assertNotNull(suggestion);
        assertEquals(DecisionType.CLAIM, suggestion.decision());
    }

    @Test
    void missingEvidenceYieldsInsufficientEvidence() {
        UnitAnalysisContext context = new UnitAnalysisContext(
                "org_demo_alpha",
                "UNIT-9999",
                List.of(createCharge("CHG-5", "inbound_defect_fee", LocalDate.of(2026, 7, 1))),
                List.of(),
                List.of()
        );

        Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context);
        assertEquals(1, decisions.size());
        DecisionSuggestion suggestion = decisions.get("CHG-5");
        assertNotNull(suggestion);
        assertEquals(DecisionType.UNCERTAIN, suggestion.decision());
    }
}
