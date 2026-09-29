package com.cube.buildathon.recoverymanager.backend.dto;

import com.cube.buildathon.recoverymanager.backend.enums.AnalysisRunStatus;

import java.time.Instant;
import java.util.List;

public record AnalysisResultResponse(
        String analysisId,
        String fileName,
        AnalysisRunStatus status,
        int totalRows,
        int processedRows,
        int failedRows,
        Instant createdAt,
        AnalysisSummaryResponse summary,
        List<RowValidationError> validationErrors,
        List<ChargeResponse> charges
) {
}