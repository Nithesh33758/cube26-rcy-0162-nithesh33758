package com.cube.buildathon.recoverymanager.backend.controller;

import com.cube.buildathon.recoverymanager.backend.dto.ChargeResponse;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/charges")
public class ChargeController {
    private final AnalysisService analysisService;

    public ChargeController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping
    public List<ChargeResponse> list(
            @RequestParam(name = "analysisId", required = false) String analysisId,
            @RequestParam(name = "unitId", required = false) String unitId,
            @RequestParam(name = "decision", required = false) DecisionType decision,
            @RequestParam(name = "chargeType", required = false) String chargeType
    ) {
        return analysisService.getCharges(analysisId, unitId, decision, chargeType);
    }

    @GetMapping("/{lineId}")
    public ChargeResponse get(
            @PathVariable("lineId") String lineId,
            @RequestParam(name = "analysisId", required = false) String analysisId
    ) {
        return analysisService.getCharge(lineId, analysisId);
    }
}