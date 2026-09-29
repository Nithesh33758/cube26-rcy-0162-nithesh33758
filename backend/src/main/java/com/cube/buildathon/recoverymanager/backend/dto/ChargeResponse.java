package com.cube.buildathon.recoverymanager.backend.dto;

import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ChargeResponse(
        String id,
        String lineId,
        String analysisId,
        String reportType,
        String unitId,
        String orgId,
        String sku,
        String fnsku,
        String fbaShipmentId,
        String orderId,
        String chargeType,
        int quantity,
        BigDecimal amount,
        String currency,
        LocalDate postedDate,
        DecisionType decision,
        DecisionType originalDecision,
        String decisionExplanation,
        Integer confidence,
        int evidenceCount,
        String status,
        List<EvidenceResponse> evidence,
        List<RequirementResponse> requirements,
        String chargeSubtype,
        String granularity,
        String shipmentId,
        String asin,
        BigDecimal amountPerUnit,
        String description,
        LocalDate chargedAt
) {
}