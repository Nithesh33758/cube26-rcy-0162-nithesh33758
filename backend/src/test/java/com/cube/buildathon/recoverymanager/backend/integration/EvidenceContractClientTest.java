package com.cube.buildathon.recoverymanager.backend.integration;

import com.cube.buildathon.recoverymanager.backend.config.EvidenceContractProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.GET;

class EvidenceContractClientTest {
    private static final String ALPHA_UUID = "00000000-0000-0000-0000-000000000001";
    private static final String BRAVO_UUID = "00000000-0000-0000-0000-000000000002";

    private MockRestServiceServer server;
    private EvidenceContractProperties properties;
    private EvidenceContractClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        properties = configuredProperties("page-token");
        client = new EvidenceContractClient(builder, properties);
    }

    @Test
    void fetchesAllPagesUsingConfiguredCursorAndKeepsTenantScope() {
        server.expect(requestTo("https://evidence.invalid/v1/records?since=2026-09-01T00:00:00Z&agent=prep"))
                .andExpect(method(GET))
                .andExpect(queryParam("since", "2026-09-01T00:00:00Z"))
                .andExpect(queryParam("agent", "prep"))
                .andExpect(header("Authorization", "Bearer test-token"))
                .andRespond(withSuccess(page("record-1", ALPHA_UUID, "cursor-2"), MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://evidence.invalid/v1/records?since=2026-09-01T00:00:00Z&agent=prep&page-token=cursor-2"))
                .andExpect(method(GET))
                .andExpect(queryParam("page-token", "cursor-2"))
                .andExpect(request -> assertEquals(false,
                        request.getURI().getRawQuery().contains("organization_id")))
                .andRespond(withSuccess(page("record-2", ALPHA_UUID, ""), MediaType.APPLICATION_JSON));

        var records = client.fetchRecords(
                "org_demo_alpha", Instant.parse("2026-09-01T00:00:00Z"), EvidenceContractAgent.PREP);

        assertEquals(2, records.size());
        assertEquals("record-1", records.get(0).recordId());
        assertEquals("record-2", records.get(1).recordId());
        server.verify();
    }

    @Test
    void rejectsRecordsFromAnotherOrganization() {
        server.expect(requestTo("https://evidence.invalid/v1/records?since=&agent=receiving"))
                .andExpect(method(GET))
                .andRespond(withSuccess(page("foreign-record", BRAVO_UUID, ""), MediaType.APPLICATION_JSON));

        assertThrows(SecurityException.class, () -> client.fetchRecords(
                "org_demo_alpha", null, EvidenceContractAgent.RECEIVING));
        server.verify();
    }

    @Test
    void rejectsUnmappedLocalOrganizationBeforeMakingRequest() {
        assertThrows(IllegalStateException.class, () -> client.fetchRecords(
                "org_demo_unknown", null, EvidenceContractAgent.PREP));
        server.verify();
    }

    @Test
    void requiresConfiguredCursorParameterWhenAnotherPageExists() {
        server.expect(requestTo("https://evidence.invalid/v1/records?since=&agent=pack"))
                .andExpect(method(GET))
                .andRespond(withSuccess(page("record-1", ALPHA_UUID, "cursor-2"), MediaType.APPLICATION_JSON));
        properties.setCursorRequestParameter("");

        assertThrows(IllegalStateException.class, () -> client.fetchRecords(
                "org_demo_alpha", null, EvidenceContractAgent.PACK));
        server.verify();
    }

    private EvidenceContractProperties configuredProperties(String cursorParameter) {
        EvidenceContractProperties configured = new EvidenceContractProperties();
        configured.setBaseUrl("https://evidence.invalid");
        configured.setAuthenticationType("bearer");
        configured.setAuthenticationToken("test-token");
        configured.setCursorRequestParameter(cursorParameter);
        configured.setOrganizationIds(Map.of(
                "org_demo_alpha", ALPHA_UUID,
                "org_demo_bravo", BRAVO_UUID));
        return configured;
    }

    private String page(String recordId, String organizationId, String nextCursor) {
        return """
                {"records":[{"record_id":"%s","schema_version":"1.1","organization_id":"%s","agent":"prep","status":"complete"}],"next_cursor":"%s"}
                """.formatted(recordId, organizationId, nextCursor);
    }
}