package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.Decision;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DecisionRepository extends JpaRepository<Decision, Long> {
    @Query("select count(d) from Decision d where d.orgId = :orgId and d.charge.analysisRun.analysisId = :analysisId and d.decision = :decision")
    long countForAnalysisAndDecision(
            @Param("orgId") String orgId,
            @Param("analysisId") String analysisId,
            @Param("decision") DecisionType decision);

}