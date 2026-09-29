package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.ValidationIssue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ValidationIssueRepository extends JpaRepository<ValidationIssue, Long> {
    List<ValidationIssue> findByOrgIdAndAnalysisRun_AnalysisIdOrderByRowNumberAscIdAsc(String orgId, String analysisId);
}