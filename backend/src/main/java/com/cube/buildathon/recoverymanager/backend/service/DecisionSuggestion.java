package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;

public record DecisionSuggestion(DecisionType decision, String reason) {
}