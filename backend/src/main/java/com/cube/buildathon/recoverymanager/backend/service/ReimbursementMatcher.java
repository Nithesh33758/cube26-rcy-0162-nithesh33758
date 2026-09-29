package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.entity.Charge;
import com.cube.buildathon.recoverymanager.backend.entity.Reimbursement;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class ReimbursementMatcher {
    public Set<String> findCoveredChargeIds(List<Charge> charges, List<Reimbursement> reimbursements) {
        List<CreditBalance> balances = netCredits(reimbursements);
        List<Charge> orderedCharges = charges.stream()
                .sorted(Comparator.comparing(Charge::getLineId))
                .toList();
        Set<String> coveredChargeIds = new HashSet<>();

        for (Charge charge : orderedCharges) {
            if (charge.getOrderId() == null || charge.getSku() == null || charge.getAmount() == null) {
                continue;
            }
            for (CreditBalance balance : balances) {
                if (!balance.matches(charge)) {
                    continue;
                }
                if (balance.quantity.compareTo(BigDecimal.valueOf(charge.getQuantity())) >= 0
                        && balance.amount.compareTo(charge.getAmount()) >= 0) {
                    balance.quantity = balance.quantity.subtract(BigDecimal.valueOf(charge.getQuantity()));
                    balance.amount = balance.amount.subtract(charge.getAmount());
                    coveredChargeIds.add(charge.getLineId());
                    break;
                }
            }
        }
        return coveredChargeIds;
    }

    private List<CreditBalance> netCredits(List<Reimbursement> reimbursements) {
        Map<String, List<Reimbursement>> adjustmentsByOriginalId = new HashMap<>();
        for (Reimbursement reimbursement : reimbursements) {
            if (reimbursement.getOriginalReimbursementId() != null) {
                adjustmentsByOriginalId.computeIfAbsent(reimbursement.getOriginalReimbursementId(), ignored -> new ArrayList<>())
                        .add(reimbursement);
            }
        }

        List<CreditBalance> balances = new ArrayList<>();
        for (Reimbursement reimbursement : reimbursements) {
            if (reimbursement.getOriginalReimbursementId() != null) {
                continue;
            }
            BigDecimal amount = reimbursement.getAmountTotal();
            BigDecimal quantity = BigDecimal.valueOf(reimbursement.getQuantityReimbursedCash())
                    .add(BigDecimal.valueOf(reimbursement.getQuantityReimbursedInventory()));
            for (Reimbursement adjustment : adjustmentsByOriginalId.getOrDefault(reimbursement.getReimbursementId(), List.of())) {
                boolean cancellation = adjustment.getReason() != null
                        && adjustment.getReason().toLowerCase().contains("cancellation");
                BigDecimal adjustmentAmount = adjustment.getAmountTotal();
                BigDecimal adjustmentQuantity = BigDecimal.valueOf(adjustment.getQuantityReimbursedCash())
                        .add(BigDecimal.valueOf(adjustment.getQuantityReimbursedInventory()));
                if (cancellation) {
                    amount = amount.subtract(adjustmentAmount.abs());
                    quantity = quantity.subtract(adjustmentQuantity.abs());
                } else {
                    amount = amount.add(adjustmentAmount);
                    quantity = quantity.add(adjustmentAmount.signum() < 0
                            ? adjustmentQuantity.negate() : adjustmentQuantity);
                }
            }
            if (amount.signum() > 0 && quantity.signum() > 0) {
                balances.add(new CreditBalance(reimbursement, amount, quantity));
            }
        }
        return balances;
    }

    private static final class CreditBalance {
        private final Reimbursement reimbursement;
        private BigDecimal amount;
        private BigDecimal quantity;

        private CreditBalance(Reimbursement reimbursement, BigDecimal amount, BigDecimal quantity) {
            this.reimbursement = reimbursement;
            this.amount = amount;
            this.quantity = quantity;
        }

        private boolean matches(Charge charge) {
            return reimbursement.getAmazonOrderId() != null
                    && reimbursement.getAmazonOrderId().equals(charge.getOrderId())
                    && reimbursement.getSku().equals(charge.getSku())
                    && reimbursement.getCurrency().equalsIgnoreCase(charge.getCurrency())
                    && (reimbursement.getFnsku() == null || charge.getFnsku() == null
                        || reimbursement.getFnsku().equals(charge.getFnsku()));
        }
    }
}