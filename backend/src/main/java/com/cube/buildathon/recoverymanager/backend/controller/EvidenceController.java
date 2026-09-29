package com.cube.buildathon.recoverymanager.backend.controller;

import com.cube.buildathon.recoverymanager.backend.dto.EvidenceResponse;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/evidence")
public class EvidenceController {
    private final AnalysisService analysisService;

    public EvidenceController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping
    public List<EvidenceResponse> list(
            @RequestParam("unitId") String unitId,
            @RequestParam(name = "sourceType", required = false) EvidenceSourceType sourceType
    ) {
        return analysisService.getEvidence(unitId, sourceType);
    }
}