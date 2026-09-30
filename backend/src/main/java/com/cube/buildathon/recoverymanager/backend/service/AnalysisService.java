package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.config.TenantDatabaseScope;
import com.cube.buildathon.recoverymanager.backend.dto.AnalysisResultResponse;
import com.cube.buildathon.recoverymanager.backend.dto.AnalysisStatusResponse;
import com.cube.buildathon.recoverymanager.backend.dto.AnalysisSummaryResponse;
import com.cube.buildathon.recoverymanager.backend.dto.ChargeResponse;
import com.cube.buildathon.recoverymanager.backend.dto.RowValidationError;
import com.cube.buildathon.recoverymanager.backend.entity.AnalysisRun;
import com.cube.buildathon.recoverymanager.backend.entity.Charge;
import com.cube.buildathon.recoverymanager.backend.entity.Decision;
import com.cube.buildathon.recoverymanager.backend.entity.Evidence;
import com.cube.buildathon.recoverymanager.backend.entity.Reimbursement;
import com.cube.buildathon.recoverymanager.backend.entity.Requirement;
import com.cube.buildathon.recoverymanager.backend.entity.ValidationIssue;
import com.cube.buildathon.recoverymanager.backend.enums.AnalysisRunStatus;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.exception.ApiException;
import com.cube.buildathon.recoverymanager.backend.repository.AnalysisRunRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ChargeRepository;
import com.cube.buildathon.recoverymanager.backend.repository.DecisionRepository;
import com.cube.buildathon.recoverymanager.backend.repository.EvidenceRepository;
import com.cube.buildathon.recoverymanager.backend.repository.RequirementRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ReimbursementRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ValidationIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalysisService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AnalysisService.class);
        private static final String AI_UNAVAILABLE_REASON =
            "Authoritative rules and contracted evidence are not configured; manual review is required.";

    private final AnalysisRunRepository analysisRunRepository;
    private final ChargeRepository chargeRepository;
    private final DecisionRepository decisionRepository;
    private final EvidenceRepository evidenceRepository;
    private final RequirementRepository requirementRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final ValidationIssueRepository validationIssueRepository;
    private final TenantDatabaseScope tenantDatabaseScope;
    private final UnitDecisionProvider unitDecisionProvider;
    private final ChargeResponseMapper chargeResponseMapper;
    private final ReimbursementMatcher reimbursementMatcher;

    public AnalysisService(
            AnalysisRunRepository analysisRunRepository,
            ChargeRepository chargeRepository,
            DecisionRepository decisionRepository,
            EvidenceRepository evidenceRepository,
            RequirementRepository requirementRepository,
            ReimbursementRepository reimbursementRepository,
            ValidationIssueRepository validationIssueRepository,
            TenantDatabaseScope tenantDatabaseScope,
            UnitDecisionProvider unitDecisionProvider,
            ChargeResponseMapper chargeResponseMapper,
            ReimbursementMatcher reimbursementMatcher
    ) {
        this.analysisRunRepository = analysisRunRepository;
        this.chargeRepository = chargeRepository;
        this.decisionRepository = decisionRepository;
        this.evidenceRepository = evidenceRepository;
        this.requirementRepository = requirementRepository;
        this.reimbursementRepository = reimbursementRepository;
        this.validationIssueRepository = validationIssueRepository;
        this.tenantDatabaseScope = tenantDatabaseScope;
        this.unitDecisionProvider = unitDecisionProvider;
        this.chargeResponseMapper = chargeResponseMapper;
        this.reimbursementMatcher = reimbursementMatcher;
    }

    @Transactional
    public AnalysisStatusResponse startAnalysis(String analysisId) {
        tenantDatabaseScope.applyToCurrentTransaction();
        String orgId = tenantDatabaseScope.currentOrgId();
        AnalysisRun run = requireRun(orgId, analysisId);
        if (run.getStatus() != AnalysisRunStatus.VALIDATED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_ANALYSIS_STATE",
                    "Only a validated analysis can be started");
        }

        run.setStatus(AnalysisRunStatus.PROCESSING);
        run.setCurrentStage("Grouping charges by Unit Id");
        run.setErrorMessage(null);

        List<Charge> analysisCharges = chargeRepository
            .findByOrgIdAndAnalysisRun_AnalysisIdOrderByPostedDateDescLineIdAsc(orgId, analysisId);
        List<Reimbursement> reimbursements = reimbursementRepository.findByOrgId(orgId);
        var reimbursedChargeIds = reimbursementMatcher.findCoveredChargeIds(analysisCharges, reimbursements);
        List<String> unitIds = chargeRepository.findDistinctUnitIds(orgId, analysisId);
        int processedRows = 0;
        boolean providerFailed = false;

        for (int index = 0; index < unitIds.size(); index++) {
            String unitId = unitIds.get(index);
            List<Charge> charges = chargeRepository.findByOrgIdAndAnalysisRun_AnalysisIdAndUnitIdOrderByLineId(
                    orgId, analysisId, unitId);
            run.setCurrentStage("Assessing unit " + (index + 1) + " of " + unitIds.size());

            List<Evidence> evidence = evidenceRepository.findForUnit(orgId, unitId, null);
            List<String> chargeTypes = charges.stream().map(Charge::getChargeType).filter(type -> type != null).distinct().toList();
            List<Requirement> requirements = chargeTypes.isEmpty()
                    ? List.of()
                    : requirementRepository.findByOrgIdAndActiveTrueAndChargeTypeIn(orgId, chargeTypes);
            UnitAnalysisContext context = createContext(orgId, unitId, charges, evidence, requirements);

            Map<String, DecisionSuggestion> suggestions;
            try {
                suggestions = unitDecisionProvider.analyzeUnit(context);
                if (suggestions == null) {
                    suggestions = Map.of();
                }
            } catch (RuntimeException exception) {
                LOGGER.warn("Local decision provider failed during analysis", exception);
                suggestions = Map.of();
                providerFailed = true;
            }

            List<Decision> decisions = new ArrayList<>();
            for (Charge charge : charges) {
                if (reimbursedChargeIds.contains(charge.getLineId())) {
                    decisions.add(createDecision(charge, DecisionType.REJECT,
                            "A matching reimbursement covers this charge; duplicate claim suppressed (Reject)."));
                    continue;
                }
                DecisionSuggestion suggestion = suggestions.get(charge.getLineId());
                DecisionType decisionType = normalizeDecision(suggestion == null ? null : suggestion.decision());
                String reason = suggestion == null || suggestion.reason() == null || suggestion.reason().isBlank()
                        ? AI_UNAVAILABLE_REASON : suggestion.reason();
                decisions.add(createDecision(charge, decisionType, reason));
            }
            decisionRepository.saveAll(decisions);

            processedRows += charges.size();
            run.setProcessedRows(processedRows);
            run.setSuccessfulRows(processedRows);
            analysisRunRepository.save(run);
        }

        run.setStatus(AnalysisRunStatus.COMPLETED);
        run.setProcessedRows(processedRows);
        run.setSuccessfulRows(processedRows);
        run.setCurrentStage("Analysis complete");
        if (providerFailed || !unitDecisionProvider.isConfigured()) {
            run.setErrorMessage("Authoritative rules or contracted evidence are unavailable; unresolved charges require review.");
        }
        analysisRunRepository.save(run);
        return toStatusResponse(run);
    }

    @Transactional(readOnly = true)
    public AnalysisStatusResponse getStatus(String analysisId) {
        tenantDatabaseScope.applyToCurrentTransaction();
        AnalysisRun run = requireRun(tenantDatabaseScope.currentOrgId(), analysisId);
        return toStatusResponse(run);
    }

    @Transactional(readOnly = true)
    public AnalysisResultResponse getAnalysis(String analysisId) {
        tenantDatabaseScope.applyToCurrentTransaction();
        String orgId = tenantDatabaseScope.currentOrgId();
        AnalysisRun run = requireRun(orgId, analysisId);
        List<Charge> charges = chargeRepository.findByOrgIdAndAnalysisRun_AnalysisIdOrderByPostedDateDescLineIdAsc(
                orgId, analysisId);
        List<ChargeResponse> chargeResponses = charges.stream().map(chargeResponseMapper::toResponse).toList();
        long claims = count(orgId, analysisId, DecisionType.CLAIM);
        long rejected = count(orgId, analysisId, DecisionType.REJECT);
        long uncertain = count(orgId, analysisId, DecisionType.UNCERTAIN);
        AnalysisSummaryResponse summary = new AnalysisSummaryResponse(
                charges.size(),
                claims,
                rejected,
                uncertain,
                uncertain,
                claims,
                rejected,
                uncertain,
                0,
                0);
        List<RowValidationError> validationErrors = validationIssueRepository
                .findByOrgIdAndAnalysisRun_AnalysisIdOrderByRowNumberAscIdAsc(orgId, analysisId)
                .stream().map(this::toRowError).toList();

        return new AnalysisResultResponse(run.getAnalysisId(), run.getFileName(), run.getStatus(),
                run.getTotalRows(), run.getProcessedRows(), run.getFailedRows(), run.getCreatedAt(),
                summary, validationErrors, chargeResponses);
    }

    @Transactional(readOnly = true)
    public List<ChargeResponse> getCharges(String analysisId, String unitId, DecisionType decision, String chargeType) {
        tenantDatabaseScope.applyToCurrentTransaction();
        return chargeRepository.search(tenantDatabaseScope.currentOrgId(), emptyToNull(analysisId),
                        emptyToNull(unitId), emptyToNull(chargeType), decision)
                .stream().map(chargeResponseMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ChargeResponse getCharge(String lineId, String analysisId) {
        tenantDatabaseScope.applyToCurrentTransaction();
        String orgId = tenantDatabaseScope.currentOrgId();
        Charge charge = emptyToNull(analysisId) == null
                ? chargeRepository.findFirstByOrgIdAndLineIdOrderByCreatedAtDesc(orgId, lineId)
                    .orElseThrow(() -> notFound("Charge", lineId))
                : chargeRepository.findByOrgIdAndAnalysisRun_AnalysisIdAndLineId(orgId, analysisId, lineId)
                    .orElseThrow(() -> notFound("Charge", lineId));
        return chargeResponseMapper.toResponse(charge);
    }

    @Transactional(readOnly = true)
    public List<com.cube.buildathon.recoverymanager.backend.dto.EvidenceResponse> getEvidence(
            String unitId, EvidenceSourceType sourceType) {
        tenantDatabaseScope.applyToCurrentTransaction();
        if (unitId == null || unitId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "UNIT_ID_REQUIRED", "unitId is required");
        }
        return evidenceRepository.findForUnit(tenantDatabaseScope.currentOrgId(), unitId, sourceType)
                .stream().map(evidence -> new com.cube.buildathon.recoverymanager.backend.dto.EvidenceResponse(
                        evidence.getRecordId(), evidence.getUnitId(), evidence.getSourceType(),
                        evidence.getRequirement(), evidence.getStatus(), evidence.getFinding(),
                        evidence.getTimestamp(), evidence.getMetadataJson()))
                .toList();
    }

    private UnitAnalysisContext createContext(
            String orgId,
            String unitId,
            List<Charge> charges,
            List<Evidence> evidence,
            List<Requirement> requirements
    ) {
        List<UnitAnalysisContext.ChargeInput> chargeInputs = charges.stream().map(charge ->
                new UnitAnalysisContext.ChargeInput(charge.getLineId(), charge.getChargeType(),
                        charge.getQuantity(), charge.getAmount(), charge.getPostedDate(), charge.getSku(),
                charge.getFnsku(), charge.getFbaShipmentId(), charge.getOrderId(), charge.getChargeSubtype(),
                charge.getGranularity(), charge.getShipmentId(), charge.getAsin(), charge.getCurrency(),
                charge.getAmountPerUnit(), charge.getDescription(),
                charge.getChargedAt() == null ? charge.getPostedDate() : charge.getChargedAt())).toList();
        List<UnitAnalysisContext.EvidenceInput> evidenceInputs = evidence.stream().map(item ->
                new UnitAnalysisContext.EvidenceInput(item.getRecordId(), item.getSourceType(),
                        item.getRequirement(), item.getStatus(), item.getFinding(), item.getTimestamp(),
                        item.getMetadataJson())).toList();
        List<UnitAnalysisContext.RequirementInput> requirementInputs = requirements.stream().map(item ->
                new UnitAnalysisContext.RequirementInput(item.getId(), item.getName(), item.getDescription(),
                        item.getChargeType(), item.getRule())).toList();
        return new UnitAnalysisContext(orgId, unitId, chargeInputs, evidenceInputs, requirementInputs);
    }

    private Decision createDecision(Charge charge, DecisionType decisionType, String reason) {
        Decision decision = new Decision();
        decision.setCharge(charge);
        decision.setOrgId(charge.getOrgId());
        decision.setUnitId(charge.getUnitId());
        decision.setDecision(decisionType);
        decision.setOriginalDecision(decisionType);
        decision.setReason(reason);
        return decision;
    }

    private AnalysisRun requireRun(String orgId, String analysisId) {
        return analysisRunRepository.findByOrgIdAndAnalysisId(orgId, analysisId)
                .orElseThrow(() -> notFound("Analysis", analysisId));
    }

    private ApiException notFound(String resource, String id) {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", resource + " was not found", List.of(id));
    }

    private long count(String orgId, String analysisId, DecisionType type) {
        return decisionRepository.countForAnalysisAndDecision(orgId, analysisId, type);
    }

    private AnalysisStatusResponse toStatusResponse(AnalysisRun run) {
        int percentage = run.getStatus() == AnalysisRunStatus.COMPLETED ? 100
                : run.getTotalRows() == 0 ? 0
                : Math.min(100, (run.getProcessedRows() * 100) / run.getTotalRows());
        return new AnalysisStatusResponse(run.getAnalysisId(), run.getStatus(), run.getCurrentStage(),
                run.getTotalRows(), run.getProcessedRows(), run.getSuccessfulRows(), run.getFailedRows(),
                percentage, run.getErrorMessage());
    }

    private RowValidationError toRowError(ValidationIssue issue) {
        return new RowValidationError(issue.getRowNumber(), issue.getField(), issue.getMessage());
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private DecisionType normalizeDecision(DecisionType type) {
        if (type == null) {
            return DecisionType.UNCERTAIN;
        }
        return switch (type) {
            case CLAIM, CONTESTED -> DecisionType.CLAIM;
            case REJECT, ACCEPTED, ALREADY_REIMBURSED, OUT_OF_WINDOW -> DecisionType.REJECT;
            default -> DecisionType.UNCERTAIN;
        };
    }
}