package com.cube.buildathon.recoverymanager.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParsedReimbursementRow(
        int rowNumber,
        String reimbursementId,
        String caseId,
        LocalDate approvalDate,
        String amazonOrderId,
        String sku,
        String fnsku,
        String asin,
        String reason,
        String condition,
        String currency,
        BigDecimal amountPerUnit,
        BigDecimal amountTotal,
        int quantityReimbursedCash,
        int quantityReimbursedInventory,
        String originalReimbursementId
) {
}