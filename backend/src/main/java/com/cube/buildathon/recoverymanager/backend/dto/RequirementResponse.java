package com.cube.buildathon.recoverymanager.backend.dto;

public record RequirementResponse(
        Long id,
        String name,
        String description,
        String chargeType,
        boolean active
) {
}