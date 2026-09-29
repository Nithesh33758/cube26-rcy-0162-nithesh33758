package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UnconfiguredAiDecisionProvider implements UnitDecisionProvider {
    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public Map<String, DecisionSuggestion> analyzeUnit(UnitAnalysisContext context) {
        return context.charges().stream().collect(Collectors.toMap(
                UnitAnalysisContext.ChargeInput::lineId,
                charge -> new DecisionSuggestion(
                    DecisionType.INSUFFICIENT_EVIDENCE,
                    "Authoritative rules and contracted evidence are not configured; manual review is required.")));
    }
}