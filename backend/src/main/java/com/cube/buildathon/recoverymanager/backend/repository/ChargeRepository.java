package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.Charge;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChargeRepository extends JpaRepository<Charge, Long> {
    @Query("select distinct c.unitId from Charge c where c.orgId = :orgId and c.analysisRun.analysisId = :analysisId order by c.unitId")
    List<String> findDistinctUnitIds(@Param("orgId") String orgId, @Param("analysisId") String analysisId);

    List<Charge> findByOrgIdAndAnalysisRun_AnalysisIdAndUnitIdOrderByLineId(
            String orgId, String analysisId, String unitId);

        List<Charge> findByOrgIdAndAnalysisRun_AnalysisIdOrderByPostedDateDescLineIdAsc(String orgId, String analysisId);

        long countByOrgIdAndAnalysisRun_AnalysisId(String orgId, String analysisId);

    @Query("""
            select c from Charge c left join c.decision d
            where c.orgId = :orgId
              and (:analysisId is null or c.analysisRun.analysisId = :analysisId)
              and (:unitId is null or c.unitId = :unitId)
              and (:chargeType is null or c.chargeType = :chargeType)
              and (:decision is null or d.decision = :decision)
            order by c.postedDate desc, c.lineId
            """)
    List<Charge> search(
            @Param("orgId") String orgId,
            @Param("analysisId") String analysisId,
            @Param("unitId") String unitId,
            @Param("chargeType") String chargeType,
            @Param("decision") DecisionType decision);

    Optional<Charge> findByOrgIdAndAnalysisRun_AnalysisIdAndLineId(String orgId, String analysisId, String lineId);

    Optional<Charge> findFirstByOrgIdAndLineIdOrderByCreatedAtDesc(String orgId, String lineId);
}