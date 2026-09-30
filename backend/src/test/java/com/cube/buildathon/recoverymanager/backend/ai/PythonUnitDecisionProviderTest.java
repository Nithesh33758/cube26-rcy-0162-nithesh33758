package com.cube.buildathon.recoverymanager.backend.ai;

import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.service.DecisionSuggestion;
import com.cube.buildathon.recoverymanager.backend.service.UnitAnalysisContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PythonUnitDecisionProviderTest {
        private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final PythonUnitDecisionProvider provider = new PythonUnitDecisionProvider(
            objectMapper, "http://127.0.0.1:8000/v1/analyze-unit");

    @Test
    void acceptsOnlySupportedCitedDecision() throws Exception {
        String response = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Prior prep pass.",
                "evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}
                """;

        Map<String, DecisionSuggestion> decisions = provider.parseResponse(response, context("PASS"));

        assertThat(decisions.get("CHG-1").decision()).isEqualTo(DecisionType.CONTESTED);
        assertThat(decisions.get("CHG-1").reason()).contains("EV-1", "Rule refs: 7");
    }

    @Test
    void rejectsUnsupportedVerdictsAndUnverifiableEvidence() throws Exception {
        String response = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"already_reimbursed","reason":"Paid.",
                "evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}
                """;
        String unknownEvidence = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Pass.",
                "evidenceRecordIds":["FAKE"],"requirementIds":[7]}]}
                """;

        assertThat(provider.parseResponse(response, context("PASS")).get("CHG-1").decision())
                .isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
        assertThat(provider.parseResponse(unknownEvidence, context("PASS")).get("CHG-1").decision())
                .isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
    }

    @Test
    void onlyAcceptsAcceptedWhenCitedEvidenceFailed() throws Exception {
        String response = """
                {"decisions":[{"chargeId":"CHG-1","verdict":"accepted","reason":"Check failed.",
                "evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}
                """;

        assertThat(provider.parseResponse(response, context("PASS")).get("CHG-1").decision())
                .isEqualTo(DecisionType.INSUFFICIENT_EVIDENCE);
        assertThat(provider.parseResponse(response, context("FAIL")).get("CHG-1").decision())
                .isEqualTo(DecisionType.ACCEPTED);
    }

        @Test
        void sendsNonEmptyJsonBodyToConfiguredEndpointWithoutRedirecting() throws Exception {
                AtomicReference<String> method = new AtomicReference<>();
                AtomicReference<String> path = new AtomicReference<>();
                AtomicReference<String> contentType = new AtomicReference<>();
                AtomicReference<String> requestBody = new AtomicReference<>();
                AtomicReference<String> protocol = new AtomicReference<>();
                AtomicReference<String> contentLength = new AtomicReference<>();
                AtomicReference<String> transferEncoding = new AtomicReference<>();
                AtomicReference<String> expect = new AtomicReference<>();
                AtomicReference<String> upgrade = new AtomicReference<>();
                AtomicReference<String> connection = new AtomicReference<>();
                AtomicInteger redirectedRequests = new AtomicInteger();
                HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
                server.createContext("/v1/analyze-unit", exchange -> {
                        captureRequest(exchange, method, path, contentType, requestBody, protocol,
                                        contentLength, transferEncoding, expect, upgrade, connection);
                        exchange.getResponseHeaders().add("Location", "/redirect-target");
                        respond(exchange, 307, "redirected".getBytes(StandardCharsets.UTF_8));
                });
                server.createContext("/redirect-target", exchange -> {
                        redirectedRequests.incrementAndGet();
                        respond(exchange, 200, "{\"decisions\":[]}".getBytes(StandardCharsets.UTF_8));
                });
                server.start();

                try {
                        String endpoint = "http://127.0.0.1:" + server.getAddress().getPort() + "/v1/analyze-unit";
                        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
                        PythonUnitDecisionProvider localProvider = new PythonUnitDecisionProvider(mapper, endpoint);
                        HttpClient configuredClient = (HttpClient) ReflectionTestUtils.getField(
                                        localProvider, "httpClient");

                        assertThat(configuredClient).isNotNull();
                        assertThat(configuredClient.version()).isEqualTo(HttpClient.Version.HTTP_1_1);
                        assertThat(configuredClient.proxy().orElseThrow()
                                        .select(URI.create(endpoint))).contains(Proxy.NO_PROXY);

                        assertThatThrownBy(() -> localProvider.analyzeUnit(context("PASS")))
                                        .isInstanceOf(IllegalStateException.class)
                                        .hasMessageContaining("HTTP 307", "redirected");

                        assertThat(method.get()).isEqualTo("POST");
                        assertThat(path.get()).isEqualTo("/v1/analyze-unit");
                        assertThat(protocol.get()).isEqualTo("HTTP/1.1");
                        assertThat(contentType.get()).startsWith("application/json");
                        assertThat(requestBody.get()).isNotBlank();
                        long bodyBytes = requestBody.get().getBytes(StandardCharsets.UTF_8).length;
                        boolean validFraming = contentLength.get() != null
                                        && Long.parseLong(contentLength.get()) == bodyBytes
                                        || "chunked".equalsIgnoreCase(transferEncoding.get());
                        assertThat(validFraming).isTrue();
                        assertThat(expect.get()).isNull();
                        assertThat(upgrade.get()).isNull();
                        assertThat(connection.get() == null
                                        || !connection.get().toLowerCase(java.util.Locale.ROOT).contains("upgrade"))
                                        .isTrue();
                        JsonNode json = mapper.readTree(requestBody.get());
                        assertThat(json.path("unitId").asText()).isEqualTo("UNIT-1");
                        assertThat(json.path("charges").isArray()).isTrue();
                        assertThat(json.path("charges").size()).isEqualTo(1);
                        assertThat(json.path("evidence").isArray()).isTrue();
                        assertThat(json.path("evidence").size()).isEqualTo(1);
                        assertThat(json.path("requirements").isArray()).isTrue();
                        assertThat(json.path("requirements").size()).isEqualTo(1);
                        assertThat(redirectedRequests.get()).isZero();
                } finally {
                        server.stop(0);
                }
        }

        @Test
        void defaultsToConfirmedPythonEndpoint() throws IOException {
                Properties properties = new Properties();
                try (InputStream input = getClass().getResourceAsStream("/application.properties")) {
                        assertThat(input).isNotNull();
                        properties.load(input);
                }

                assertThat(properties.getProperty("recovery-manager.ai.local.url"))
                                .satisfiesAnyOf(
                                        url -> assertThat(url).isEqualTo("${LOCAL_AI_URL:http://127.0.0.1:8000/v1/analyze-unit}"),
                                        url -> assertThat(url).isEqualTo("http://127.0.0.1:8000/v1/analyze-unit")
                                );
        }

        @Test
        @EnabledIfSystemProperty(named = "local.ai.smoke", matches = "true")
        void callsRunningLocalPythonModel() {
                Map<String, DecisionSuggestion> decisions = provider.analyzeUnit(context("PASS"));

                assertThat(decisions).containsKey("CHG-1");
                assertThat(decisions.get("CHG-1").decision()).isIn(
                                DecisionType.CONTESTED, DecisionType.ACCEPTED, DecisionType.INSUFFICIENT_EVIDENCE);
        }

        private void captureRequest(
                        HttpExchange exchange,
                        AtomicReference<String> method,
                        AtomicReference<String> path,
                        AtomicReference<String> contentType,
                        AtomicReference<String> body,
                        AtomicReference<String> protocol,
                        AtomicReference<String> contentLength,
                        AtomicReference<String> transferEncoding,
                        AtomicReference<String> expect,
                        AtomicReference<String> upgrade,
                        AtomicReference<String> connection
        ) throws IOException {
                method.set(exchange.getRequestMethod());
                path.set(exchange.getRequestURI().getPath());
                contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
                body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                        protocol.set(exchange.getProtocol());
                        contentLength.set(exchange.getRequestHeaders().getFirst("Content-Length"));
                        transferEncoding.set(exchange.getRequestHeaders().getFirst("Transfer-Encoding"));
                        expect.set(exchange.getRequestHeaders().getFirst("Expect"));
                        upgrade.set(exchange.getRequestHeaders().getFirst("Upgrade"));
                        connection.set(exchange.getRequestHeaders().getFirst("Connection"));
        }

        private void respond(HttpExchange exchange, int status, byte[] responseBody) throws IOException {
                exchange.sendResponseHeaders(status, responseBody.length);
                try (var output = exchange.getResponseBody()) {
                        output.write(responseBody);
                }
        }

    private UnitAnalysisContext context(String status) {
        UnitAnalysisContext.ChargeInput charge = new UnitAnalysisContext.ChargeInput(
                "CHG-1", "inbound_defect", 1, new BigDecimal("5.00"), LocalDate.parse("2026-09-01"),
                "SKU-1", "FNSKU-1", "FBA-1", "ORD-1", "unbagged_unit", "unit", "FBA-1",
                "ASIN-1", "USD", new BigDecimal("5.00"), "Inbound defect fee", LocalDate.parse("2026-09-01"));
        UnitAnalysisContext.EvidenceInput evidence = new UnitAnalysisContext.EvidenceInput(
                "EV-1", EvidenceSourceType.PREP, "polybag_present", status,
                "A polybag is present", Instant.parse("2026-08-31T08:00:00Z"), "not sent to model");
        UnitAnalysisContext.RequirementInput requirement = new UnitAnalysisContext.RequirementInput(
                7L, "Bagging requirement", "Unit must be bagged", "inbound_defect", "Policy text");
        return new UnitAnalysisContext("org_demo_alpha", "UNIT-1", List.of(charge), List.of(evidence), List.of(requirement));
    }
}