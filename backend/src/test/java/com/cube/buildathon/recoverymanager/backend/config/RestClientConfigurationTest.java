package com.cube.buildathon.recoverymanager.backend.config;

import com.cube.buildathon.recoverymanager.backend.integration.EvidenceContractClient;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class RestClientConfigurationTest {
    @Test
    void providesBuilderAndWiresEvidenceContractClient() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(
                RestClientConfiguration.class,
                EvidenceContractProperties.class,
                EvidenceContractClient.class)) {
            assertNotNull(context.getBean(RestClient.Builder.class));
            assertNotNull(context.getBean(EvidenceContractClient.class));
        }
    }
}