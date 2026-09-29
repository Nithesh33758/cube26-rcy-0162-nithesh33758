package com.cube.buildathon.recoverymanager.backend.dto;

import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;

import java.time.Instant;

public record EvidenceResponse(
        String recordId,
        String unitId,
        EvidenceSourceType sourceType,
        String requirement,
        String status,
        String finding,
        Instant timestamp,
        String metadataJson
) {
}