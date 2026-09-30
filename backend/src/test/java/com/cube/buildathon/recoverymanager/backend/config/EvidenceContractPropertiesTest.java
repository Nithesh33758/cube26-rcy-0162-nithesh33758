package com.cube.buildathon.recoverymanager.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EvidenceContractPropertiesTest {
    @Test
    void bindsEnvironmentBackedContractConfigurationAndTenantMappings() {
        Binder binder = new Binder(new MapConfigurationPropertySource(Map.of(
                "recovery-manager.evidence.contract.base-url", "https://evidence.invalid",
                "recovery-manager.evidence.contract.authentication-type", "header",
                "recovery-manager.evidence.contract.authentication-token", "test-token",
                "recovery-manager.evidence.contract.authentication-header-name", "X-Test-Token",
                "recovery-manager.evidence.contract.cursor-request-parameter", "page-token",
                "recovery-manager.evidence.contract.organization-ids.org_demo_alpha",
                "00000000-0000-0000-0000-000000000001",
                "recovery-manager.evidence.contract.organization-ids.org_demo_bravo",
                "00000000-0000-0000-0000-000000000002")));

        EvidenceContractProperties properties = binder.bind(
                "recovery-manager.evidence.contract", Bindable.of(EvidenceContractProperties.class))
                .orElseThrow(() -> new IllegalStateException("Evidence contract properties were not bound"));

        assertEquals("https://evidence.invalid", properties.getBaseUrl());
        assertEquals("header", properties.getAuthenticationType());
        assertEquals("X-Test-Token", properties.getAuthenticationHeaderName());
        assertEquals("page-token", properties.getCursorRequestParameter());
        assertEquals("00000000-0000-0000-0000-000000000001",
                properties.getOrganizationIds().get("org_demo_alpha"));
        assertEquals("00000000-0000-0000-0000-000000000002",
                properties.getOrganizationIds().get("org_demo_bravo"));
    }
}