package com.cube.buildathon.recoverymanager.backend.repository;

import com.cube.buildathon.recoverymanager.backend.entity.Reimbursement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReimbursementRepository extends JpaRepository<Reimbursement, Long> {
    boolean existsByOrgIdAndReimbursementId(String orgId, String reimbursementId);

    List<Reimbursement> findByOrgId(String orgId);
}