package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.AnalysisRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalysisRunRepository extends JpaRepository<AnalysisRun, Long> {
    Optional<AnalysisRun> findByOrgIdAndAnalysisId(String orgId, String analysisId);
}