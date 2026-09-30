package com.cube.buildathon.recoverymanager.backend.integration;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record EvidenceContractRecord(
        @JsonProperty("record_id") String recordId,
        @JsonProperty("schema_version") String schemaVersion,
        @JsonProperty("organization_id") String organizationId,
        @JsonProperty("client_id") String clientId,
        String agent,
        Subject subject,
        @JsonProperty("captured_at") Instant capturedAt,
        @JsonProperty("operator_label") String operatorLabel,
        List<Image> images,
        List<Check> checks,
        Outcome outcome,
        List<OverrideEntry> overrides,
        String status,
        @JsonProperty("content_hash") String contentHash
) {
    public record Subject(
            String type,
            String asin,
            String sku,
            @JsonProperty("order_id") String orderId,
            @JsonProperty("po_line_id") String poLineId,
            @JsonProperty("shipment_id") String shipmentId,
            @JsonProperty("quantity_expected") Integer quantityExpected,
            @JsonProperty("quantity_observed") Integer quantityObserved
    ) {
    }

    public record Image(
            String key,
            String sha256,
            Long bytes,
            @JsonProperty("taken_at") Instant takenAt
    ) {
    }

    public record Check(
            @JsonProperty("check_key") String checkKey,
            String verdict,
            Double confidence,
            Map<String, Object> detail,
            @JsonProperty("model_version") String modelVersion,
            @JsonProperty("latency_ms") Long latencyMs
    ) {
    }

    public record Outcome(
            String decision,
            @JsonProperty("decided_by") String decidedBy,
            @JsonProperty("decided_at") Instant decidedAt
    ) {
    }

    public record OverrideEntry(
            @JsonProperty("check_key") String checkKey,
            @JsonProperty("from_verdict") String fromVerdict,
            @JsonProperty("to_verdict") String toVerdict,
            String reason,
            String by,
            Instant at
    ) {
    }
}