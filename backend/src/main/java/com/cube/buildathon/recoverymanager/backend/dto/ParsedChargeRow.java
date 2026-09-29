package com.cube.buildathon.recoverymanager.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParsedChargeRow(
        int rowNumber,
        String lineId,
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
        LocalDate postedDate,
        String chargeSubtype,
        String granularity,
        String asin,
        String currency,
        BigDecimal amountPerUnit,
        String description
) {
}