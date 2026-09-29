package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record UnitAnalysisContext(
        String orgId,
        String unitId,
        List<ChargeInput> charges,
        List<EvidenceInput> evidence,
        List<RequirementInput> requirements
) {
    public record ChargeInput(
            String lineId,
            String chargeType,
            int quantity,
            BigDecimal amount,
            LocalDate postedDate,
            String sku,
            String fnsku,
            String fbaShipmentId,
            String orderId,
            String chargeSubtype,
            String granularity,
            String shipmentId,
            String asin,
            String currency,
            BigDecimal amountPerUnit,
            String description,
            LocalDate chargedAt
    ) {
    }

    public record EvidenceInput(
            String recordId,
            EvidenceSourceType sourceType,
            String requirement,
            String status,
            String finding,
            Instant timestamp,
            String metadataJson
    ) {
    }

    public record RequirementInput(
            Long id,
            String name,
            String description,
            String chargeType,
            String rule
    ) {
    }
}