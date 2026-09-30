package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.config.TenantDatabaseScope;
import com.cube.buildathon.recoverymanager.backend.dto.AnalysisResultResponse;
import com.cube.buildathon.recoverymanager.backend.entity.AnalysisRun;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.repository.AnalysisRunRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ChargeRepository;
import com.cube.buildathon.recoverymanager.backend.repository.DecisionRepository;
import com.cube.buildathon.recoverymanager.backend.repository.EvidenceRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ReimbursementRepository;
import com.cube.buildathon.recoverymanager.backend.repository.RequirementRepository;
import com.cube.buildathon.recoverymanager.backend.repository.ValidationIssueRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnalysisServiceSummaryTest {
    private static final String ORG_ID = "org_demo_alpha";
    private static final String ANALYSIS_ID = "ANL-SUMMARY-TEST";

    @Test
    void countsContestedSeparatelyAndPreservesClaimCount() {
        AnalysisResultResponse contestedOnly = analysisWithCounts(0, 1);
        assertThat(contestedOnly.summary().claimsRecommended()).isZero();
        assertThat(contestedOnly.summary().contested()).isEqualTo(1);

        AnalysisResultResponse actualClaim = analysisWithCounts(1, 0);
        assertThat(actualClaim.summary().claimsRecommended()).isEqualTo(1);
        assertThat(actualClaim.summary().contested()).isZero();
    }

    private AnalysisResultResponse analysisWithCounts(long claims, long contested) {
        AnalysisRunRepository analysisRunRepository = mock(AnalysisRunRepository.class);
        ChargeRepository chargeRepository = mock(ChargeRepository.class);
        DecisionRepository decisionRepository = mock(DecisionRepository.class);
        EvidenceRepository evidenceRepository = mock(EvidenceRepository.class);
        RequirementRepository requirementRepository = mock(RequirementRepository.class);
        ReimbursementRepository reimbursementRepository = mock(ReimbursementRepository.class);
        ValidationIssueRepository validationIssueRepository = mock(ValidationIssueRepository.class);
        TenantDatabaseScope tenantDatabaseScope = mock(TenantDatabaseScope.class);
        ChargeResponseMapper chargeResponseMapper = mock(ChargeResponseMapper.class);

        AnalysisRun run = new AnalysisRun();
        run.setAnalysisId(ANALYSIS_ID);
        run.setFileName("summary-test.csv");

        when(tenantDatabaseScope.currentOrgId()).thenReturn(ORG_ID);
        when(analysisRunRepository.findByOrgIdAndAnalysisId(ORG_ID, ANALYSIS_ID))
                .thenReturn(Optional.of(run));
        when(chargeRepository.findByOrgIdAndAnalysisRun_AnalysisIdOrderByPostedDateDescLineIdAsc(
                ORG_ID, ANALYSIS_ID)).thenReturn(List.of());
        when(validationIssueRepository.findByOrgIdAndAnalysisRun_AnalysisIdOrderByRowNumberAscIdAsc(
                ORG_ID, ANALYSIS_ID)).thenReturn(List.of());
        when(decisionRepository.countForAnalysisAndDecision(ORG_ID, ANALYSIS_ID, DecisionType.CLAIM))
                .thenReturn(claims);
        when(decisionRepository.countForAnalysisAndDecision(ORG_ID, ANALYSIS_ID, DecisionType.CONTESTED))
                .thenReturn(contested);

        AnalysisService service = new AnalysisService(
                analysisRunRepository,
                chargeRepository,
                decisionRepository,
                evidenceRepository,
                requirementRepository,
                reimbursementRepository,
                validationIssueRepository,
                tenantDatabaseScope,
                mock(UnitDecisionProvider.class),
                chargeResponseMapper,
                mock(ReimbursementMatcher.class));

        return service.getAnalysis(ANALYSIS_ID);
    }
}