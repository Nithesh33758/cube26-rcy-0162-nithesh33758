package com.cube.buildathon.recoverymanager.backend.dto;

import com.cube.buildathon.recoverymanager.backend.enums.AnalysisRunStatus;

public record AnalysisStatusResponse(
        String analysisId,
        AnalysisRunStatus status,
        String currentStage,
        int totalRows,
        int processedRows,
        int successfulRows,
        int failedRows,
        int percentage,
        String errorMessage
) {
}