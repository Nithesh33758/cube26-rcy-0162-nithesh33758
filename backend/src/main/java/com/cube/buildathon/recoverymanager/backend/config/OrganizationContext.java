package com.cube.buildathon.recoverymanager.backend.config;

public final class OrganizationContext {
    private static final ThreadLocal<String> CURRENT_ORG_ID = new ThreadLocal<>();

    private OrganizationContext() {
    }

    public static String getOrgId() {
        String orgId = CURRENT_ORG_ID.get();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization context is not set");
        }
        return orgId;
    }

    static void setOrgId(String orgId) {
        CURRENT_ORG_ID.set(orgId);
    }

    static void clear() {
        CURRENT_ORG_ID.remove();
    }
}