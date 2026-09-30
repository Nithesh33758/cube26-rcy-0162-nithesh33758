package com.cube.buildathon.recoverymanager.backend.dto;

public record EvidenceImportResponse(String sourceType, String fileName, int importedRecords, int importedChecks) {
}