package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.dto.ChargeResponse;
import com.cube.buildathon.recoverymanager.backend.dto.EvidenceResponse;
import com.cube.buildathon.recoverymanager.backend.dto.RequirementResponse;
import com.cube.buildathon.recoverymanager.backend.entity.Charge;
import com.cube.buildathon.recoverymanager.backend.entity.Decision;
import com.cube.buildathon.recoverymanager.backend.entity.Evidence;
import com.cube.buildathon.recoverymanager.backend.entity.Requirement;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.repository.EvidenceRepository;
import com.cube.buildathon.recoverymanager.backend.repository.RequirementRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChargeResponseMapper {
    private final EvidenceRepository evidenceRepository;
    private final RequirementRepository requirementRepository;

    public ChargeResponseMapper(EvidenceRepository evidenceRepository, RequirementRepository requirementRepository) {
        this.evidenceRepository = evidenceRepository;
        this.requirementRepository = requirementRepository;
    }

    public ChargeResponse toResponse(Charge charge) {
        List<EvidenceResponse> evidence = evidenceRepository.findForUnit(charge.getOrgId(), charge.getUnitId(), null)
                .stream().map(this::toEvidenceResponse).toList();
        List<RequirementResponse> requirements = charge.getChargeType() == null
                ? List.of()
                : requirementRepository.findByOrgIdAndActiveTrueAndChargeTypeIn(
                        charge.getOrgId(), List.of(charge.getChargeType()))
                .stream().map(this::toRequirementResponse).toList();
        Decision decision = charge.getDecision();
        DecisionType decisionType = decision == null ? null : decision.getDecision();

        return new ChargeResponse(
                charge.getLineId(),
                charge.getLineId(),
                charge.getAnalysisRun().getAnalysisId(),
                charge.getReportType(),
                charge.getUnitId(),
                charge.getOrgId(),
                charge.getSku(),
                charge.getFnsku(),
                charge.getFbaShipmentId(),
                charge.getOrderId(),
                charge.getChargeType(),
                charge.getQuantity(),
                charge.getAmount(),
                charge.getCurrency(),
                charge.getPostedDate(),
                decisionType,
                decision == null ? null : decision.getOriginalDecision(),
                decision == null ? null : decision.getReason(),
                null,
                evidence.size(),
                decisionType == DecisionType.CLAIM || decisionType == DecisionType.CONTESTED ? "Ready"
                        : decisionType == DecisionType.REJECT || decisionType == DecisionType.ACCEPTED ? "Audited"
                        : decisionType == DecisionType.ALREADY_REIMBURSED ? "ALREADY_REIMBURSED"
                        : decisionType == DecisionType.OUT_OF_WINDOW ? "OUT_OF_WINDOW" : "Pending Review",
                evidence,
                requirements,
                charge.getChargeSubtype(),
                charge.getGranularity(),
                charge.getShipmentId() == null ? charge.getFbaShipmentId() : charge.getShipmentId(),
                charge.getAsin(),
                charge.getAmountPerUnit(),
                charge.getDescription(),
                charge.getChargedAt() == null ? charge.getPostedDate() : charge.getChargedAt());
    }

    private EvidenceResponse toEvidenceResponse(Evidence evidence) {
        return new EvidenceResponse(evidence.getRecordId(), evidence.getUnitId(), evidence.getSourceType(),
                evidence.getRequirement(), evidence.getStatus(), evidence.getFinding(), evidence.getTimestamp(),
                evidence.getMetadataJson());
    }

    private RequirementResponse toRequirementResponse(Requirement requirement) {
        return new RequirementResponse(requirement.getId(), requirement.getName(), requirement.getDescription(),
                requirement.getChargeType(), requirement.isActive());
    }
}