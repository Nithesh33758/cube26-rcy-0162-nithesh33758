package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RequirementRepository extends JpaRepository<Requirement, Long> {
    List<Requirement> findByOrgIdAndActiveTrueAndChargeTypeIn(String orgId, Collection<String> chargeTypes);
}