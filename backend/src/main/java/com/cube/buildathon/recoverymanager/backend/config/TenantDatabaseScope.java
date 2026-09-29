package com.cube.buildathon.recoverymanager.backend.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TenantDatabaseScope {
    private final boolean postgres;

    @PersistenceContext
    private EntityManager entityManager;

    public TenantDatabaseScope(@Value("${spring.datasource.url}") String jdbcUrl) {
        this.postgres = jdbcUrl.startsWith("jdbc:postgresql:");
    }

    public String currentOrgId() {
        return OrganizationContext.getOrgId();
    }

    public void applyToCurrentTransaction() {
        if (postgres) {
            entityManager.createNativeQuery("select set_config('app.current_org_id', :orgId, true)")
                    .setParameter("orgId", currentOrgId())
                    .getSingleResult();
        }
    }
}