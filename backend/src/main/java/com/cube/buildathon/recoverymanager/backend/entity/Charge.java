package com.cube.buildathon.recoverymanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "charges", indexes = {
        @Index(name = "idx_charges_org_unit", columnList = "org_id,unit_id"),
        @Index(name = "idx_charges_org_analysis", columnList = "org_id,analysis_run_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_charges_run_line", columnNames = {"analysis_run_id", "line_id"})
})
public class Charge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "line_id", nullable = false, length = 160)
    private String lineId;

    @Column(name = "report_type", length = 120)
    private String reportType;

    @Column(name = "unit_id", length = 160)
    private String unitId;

    @Column(name = "org_id", nullable = false, length = 120)
    private String orgId;

    @Column(length = 160)
    private String sku;

    @Column(length = 160)
    private String fnsku;

    @Column(name = "fba_shipment_id", length = 160)
    private String fbaShipmentId;

    @Column(name = "shipment_id", length = 160)
    private String shipmentId;

    @Column(name = "order_id", length = 160)
    private String orderId;

    @Column(name = "charge_type", length = 160)
    private String chargeType;

    @Column(name = "charge_subtype", length = 160)
    private String chargeSubtype;

    @Column(name = "granularity", nullable = false, length = 16)
    private String granularity = "unit";

    @Column(length = 160)
    private String asin;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "amount_per_unit", precision = 19, scale = 4)
    private BigDecimal amountPerUnit;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(length = 1000)
    private String description;

    @Column(name = "charged_at")
    private LocalDate chargedAt;

    @Column(name = "posted_date", nullable = false)
    private LocalDate postedDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_run_id", nullable = false)
    private AnalysisRun analysisRun;

    @OneToOne(mappedBy = "charge", fetch = FetchType.LAZY)
    private Decision decision;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void beforeInsert() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getLineId() {
        return lineId;
    }

    public void setLineId(String lineId) {
        this.lineId = lineId;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getUnitId() {
        return unitId;
    }

    public void setUnitId(String unitId) {
        this.unitId = unitId;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getFnsku() {
        return fnsku;
    }

    public void setFnsku(String fnsku) {
        this.fnsku = fnsku;
    }

    public String getFbaShipmentId() {
        return fbaShipmentId;
    }

    public void setFbaShipmentId(String fbaShipmentId) {
        this.fbaShipmentId = fbaShipmentId;
    }

    public String getShipmentId() {
        return shipmentId;
    }

    public void setShipmentId(String shipmentId) {
        this.shipmentId = shipmentId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getChargeType() {
        return chargeType;
    }

    public void setChargeType(String chargeType) {
        this.chargeType = chargeType;
    }

    public String getChargeSubtype() {
        return chargeSubtype;
    }

    public void setChargeSubtype(String chargeSubtype) {
        this.chargeSubtype = chargeSubtype;
    }

    public String getGranularity() {
        return granularity;
    }

    public void setGranularity(String granularity) {
        this.granularity = granularity;
    }

    public String getAsin() {
        return asin;
    }

    public void setAsin(String asin) {
        this.asin = asin;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getAmountPerUnit() {
        return amountPerUnit;
    }

    public void setAmountPerUnit(BigDecimal amountPerUnit) {
        this.amountPerUnit = amountPerUnit;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getChargedAt() {
        return chargedAt;
    }

    public void setChargedAt(LocalDate chargedAt) {
        this.chargedAt = chargedAt;
    }

    public LocalDate getPostedDate() {
        return postedDate;
    }

    public void setPostedDate(LocalDate postedDate) {
        this.postedDate = postedDate;
    }

    public AnalysisRun getAnalysisRun() {
        return analysisRun;
    }

    public void setAnalysisRun(AnalysisRun analysisRun) {
        this.analysisRun = analysisRun;
    }

    public Decision getDecision() {
        return decision;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}