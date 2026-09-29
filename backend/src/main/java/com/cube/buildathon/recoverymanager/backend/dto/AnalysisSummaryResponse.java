package com.cube.buildathon.recoverymanager.backend.dto;

public record AnalysisSummaryResponse(
        long totalCharges,
        long claimsRecommended,
        long rejected,
        long uncertain,
        long pendingReview,
        long contested,
        long accepted,
        long insufficientEvidence,
        long alreadyReimbursed,
        long outOfWindow
) {
}