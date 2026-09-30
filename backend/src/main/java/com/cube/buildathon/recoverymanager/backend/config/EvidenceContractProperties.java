package com.cube.buildathon.recoverymanager.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
@ConfigurationProperties(prefix = "recovery-manager.evidence.contract")
public class EvidenceContractProperties {
    private String baseUrl = "";
    private String authenticationType = "";
    private String authenticationToken = "";
    private String authenticationHeaderName = "";
    private String cursorRequestParameter = "";
    private Map<String, String> organizationIds = new LinkedHashMap<>();

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getAuthenticationType() {
        return authenticationType;
    }

    public void setAuthenticationType(String authenticationType) {
        this.authenticationType = authenticationType;
    }

    public String getAuthenticationToken() {
        return authenticationToken;
    }

    public void setAuthenticationToken(String authenticationToken) {
        this.authenticationToken = authenticationToken;
    }

    public String getAuthenticationHeaderName() {
        return authenticationHeaderName;
    }

    public void setAuthenticationHeaderName(String authenticationHeaderName) {
        this.authenticationHeaderName = authenticationHeaderName;
    }

    public String getCursorRequestParameter() {
        return cursorRequestParameter;
    }

    public void setCursorRequestParameter(String cursorRequestParameter) {
        this.cursorRequestParameter = cursorRequestParameter;
    }

    public Map<String, String> getOrganizationIds() {
        return organizationIds;
    }

    public void setOrganizationIds(Map<String, String> organizationIds) {
        this.organizationIds = organizationIds == null ? new LinkedHashMap<>() : organizationIds;
    }

    public UUID organizationUuidFor(String localOrgId) {
        String configuredUuid = organizationIds.get(localOrgId);
        if (configuredUuid == null || configuredUuid.isBlank()) {
            throw new IllegalStateException(
                    "No Evidence Contract organization UUID is configured for tenant " + localOrgId);
        }
        try {
            return UUID.fromString(configuredUuid.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Invalid Evidence Contract organization UUID configured for tenant " + localOrgId,
                    exception);
        }
    }
}