package com.cube.buildathon.recoverymanager.backend.service;

import java.util.Map;

public interface UnitDecisionProvider {
    boolean isConfigured();

    Map<String, DecisionSuggestion> analyzeUnit(UnitAnalysisContext context);
}