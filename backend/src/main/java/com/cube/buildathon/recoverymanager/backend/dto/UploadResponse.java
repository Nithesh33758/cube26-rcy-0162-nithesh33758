package com.cube.buildathon.recoverymanager.backend.dto;

import com.cube.buildathon.recoverymanager.backend.enums.AnalysisRunStatus;

import java.util.List;

public record UploadResponse(
        String analysisId,
        String fileName,
        AnalysisRunStatus status,
        int totalRows,
        int validRows,
        int invalidRows,
        boolean valid,
        boolean headersValid,
        List<String> missingColumns,
        List<RowValidationError> rowErrors,
        String errorMessage
) {
}