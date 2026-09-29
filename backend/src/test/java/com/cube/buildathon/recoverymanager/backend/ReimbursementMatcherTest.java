package com.cube.buildathon.recoverymanager.backend;

import com.cube.buildathon.recoverymanager.backend.entity.Charge;
import com.cube.buildathon.recoverymanager.backend.entity.Reimbursement;
import com.cube.buildathon.recoverymanager.backend.service.ReimbursementMatcher;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReimbursementMatcherTest {
    private final ReimbursementMatcher matcher = new ReimbursementMatcher();

    @Test
    void matchesCreditsByOrderAndSkuAndDoesNotReuseTheirBalance() {
        Reimbursement credit = reimbursement("R-1", null, "warehouse lost", "ORD-1", "SKU-1", "USD", "10.00", 2);
        Charge first = charge("CHG-1", "ORD-1", "SKU-1", "USD", "5.00", 1);
        Charge second = charge("CHG-2", "ORD-1", "SKU-1", "USD", "6.00", 1);

        assertThat(matcher.findCoveredChargeIds(List.of(first, second), List.of(credit)))
                .containsExactly("CHG-1");
    }

    @Test
    void netsCancellationRowsBeforeMatching() {
        Reimbursement original = reimbursement("R-1", null, "warehouse lost", "ORD-1", "SKU-1", "USD", "10.00", 2);
        Reimbursement cancellation = reimbursement("R-2", "R-1", "reimbursement cancellation", null,
                "SKU-1", "USD", "10.00", 2);
        Charge charge = charge("CHG-1", "ORD-1", "SKU-1", "USD", "5.00", 1);

        assertThat(matcher.findCoveredChargeIds(List.of(charge), List.of(original, cancellation))).isEmpty();
    }

    @Test
    void doesNotMatchDifferentOrderCurrencyOrSku() {
        Reimbursement credit = reimbursement("R-1", null, "warehouse lost", "ORD-1", "SKU-1", "USD", "10.00", 2);
        Charge charge = charge("CHG-1", "ORD-2", "SKU-1", "EUR", "5.00", 1);

        assertThat(matcher.findCoveredChargeIds(List.of(charge), List.of(credit))).isEmpty();
    }

    private Reimbursement reimbursement(
            String id, String originalId, String reason, String orderId, String sku,
            String currency, String total, int quantity
    ) {
        Reimbursement row = new Reimbursement();
        row.setReimbursementId(id);
        row.setOriginalReimbursementId(originalId);
        row.setReason(reason);
        row.setAmazonOrderId(orderId);
        row.setSku(sku);
        row.setCurrency(currency);
        row.setAmountTotal(new BigDecimal(total));
        row.setQuantityReimbursedCash(quantity);
        return row;
    }

    private Charge charge(String id, String orderId, String sku, String currency, String amount, int quantity) {
        Charge charge = new Charge();
        charge.setLineId(id);
        charge.setOrderId(orderId);
        charge.setSku(sku);
        charge.setCurrency(currency);
        charge.setAmount(new BigDecimal(amount));
        charge.setQuantity(quantity);
        return charge;
    }
}