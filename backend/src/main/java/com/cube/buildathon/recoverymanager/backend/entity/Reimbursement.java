package com.cube.buildathon.recoverymanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "reimbursements_received", indexes = {
        @Index(name = "idx_reimbursements_org_order_sku", columnList = "org_id,amazon_order_id,sku")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_reimbursements_org_id", columnNames = {"org_id", "reimbursement_id"})
})
public class Reimbursement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 120)
    private String orgId;

    @Column(name = "reimbursement_id", nullable = false, length = 160)
    private String reimbursementId;

    @Column(name = "case_id", length = 160)
    private String caseId;

    @Column(name = "approval_date", nullable = false)
    private LocalDate approvalDate;

    @Column(name = "amazon_order_id", length = 160)
    private String amazonOrderId;

    @Column(nullable = false, length = 160)
    private String sku;

    @Column(length = 160)
    private String fnsku;

    @Column(length = 160)
    private String asin;

    @Column(nullable = false, length = 240)
    private String reason;

    @Column(name = "item_condition", length = 120)
    private String condition;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "amount_per_unit", nullable = false, precision = 19, scale = 4)
    private BigDecimal amountPerUnit;

    @Column(name = "amount_total", nullable = false, precision = 19, scale = 4)
    private BigDecimal amountTotal;

    @Column(name = "quantity_reimbursed_cash", nullable = false)
    private int quantityReimbursedCash;

    @Column(name = "quantity_reimbursed_inventory", nullable = false)
    private int quantityReimbursedInventory;

    @Column(name = "original_reimbursement_id", length = 160)
    private String originalReimbursementId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void beforeInsert() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getReimbursementId() { return reimbursementId; }
    public void setReimbursementId(String reimbursementId) { this.reimbursementId = reimbursementId; }
    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }
    public LocalDate getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDate approvalDate) { this.approvalDate = approvalDate; }
    public String getAmazonOrderId() { return amazonOrderId; }
    public void setAmazonOrderId(String amazonOrderId) { this.amazonOrderId = amazonOrderId; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getFnsku() { return fnsku; }
    public void setFnsku(String fnsku) { this.fnsku = fnsku; }
    public String getAsin() { return asin; }
    public void setAsin(String asin) { this.asin = asin; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getAmountPerUnit() { return amountPerUnit; }
    public void setAmountPerUnit(BigDecimal amountPerUnit) { this.amountPerUnit = amountPerUnit; }
    public BigDecimal getAmountTotal() { return amountTotal; }
    public void setAmountTotal(BigDecimal amountTotal) { this.amountTotal = amountTotal; }
    public int getQuantityReimbursedCash() { return quantityReimbursedCash; }
    public void setQuantityReimbursedCash(int quantityReimbursedCash) { this.quantityReimbursedCash = quantityReimbursedCash; }
    public int getQuantityReimbursedInventory() { return quantityReimbursedInventory; }
    public void setQuantityReimbursedInventory(int quantityReimbursedInventory) { this.quantityReimbursedInventory = quantityReimbursedInventory; }
    public String getOriginalReimbursementId() { return originalReimbursementId; }
    public void setOriginalReimbursementId(String originalReimbursementId) { this.originalReimbursementId = originalReimbursementId; }
    public Instant getCreatedAt() { return createdAt; }
}