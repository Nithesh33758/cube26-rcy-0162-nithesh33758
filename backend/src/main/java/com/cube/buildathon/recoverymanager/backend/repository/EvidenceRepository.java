package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.Evidence;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EvidenceRepository extends JpaRepository<Evidence, Long> {
    @Query("""
            select e from Evidence e
            where e.orgId = :orgId and e.unitId = :unitId
              and (:sourceType is null or e.sourceType = :sourceType)
            order by e.timestamp desc
            """)
    List<Evidence> findForUnit(
            @Param("orgId") String orgId,
            @Param("unitId") String unitId,
            @Param("sourceType") EvidenceSourceType sourceType);
}