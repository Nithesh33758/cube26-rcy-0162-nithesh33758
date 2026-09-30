package com.cube.buildathon.recoverymanager.backend.integration;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record EvidenceContractPage(
        List<EvidenceContractRecord> records,
        @JsonProperty("next_cursor") String nextCursor
) {
}