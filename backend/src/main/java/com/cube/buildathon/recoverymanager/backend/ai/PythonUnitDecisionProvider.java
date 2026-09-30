package com.cube.buildathon.recoverymanager.backend.ai;

import com.cube.buildathon.recoverymanager.backend.enums.DecisionType;
import com.cube.buildathon.recoverymanager.backend.service.DecisionSuggestion;
import com.cube.buildathon.recoverymanager.backend.service.UnitAnalysisContext;
import com.cube.buildathon.recoverymanager.backend.service.UnitDecisionProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PythonUnitDecisionProvider implements UnitDecisionProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(PythonUnitDecisionProvider.class);

    private static final ProxySelector DIRECT_CONNECTION = new ProxySelector() {
        @Override
        public List<Proxy> select(URI uri) {
            return List.of(Proxy.NO_PROXY);
        }

        @Override
        public void connectFailed(URI uri, SocketAddress socketAddress, IOException exception) {
        }
    };

    private static final String UNAVAILABLE_REASON =
            "The local Python model is unavailable; manual review is required.";
    private static final String INSUFFICIENT_REASON =
            "Evidence and an applicable rule do not support a reliable automated decision; manual review is required.";

    private final ObjectMapper objectMapper;
    private final URI endpoint;
    private final HttpClient httpClient;

    public PythonUnitDecisionProvider(
            ObjectMapper objectMapper,
            @Value("${recovery-manager.ai.local.url:http://127.0.0.1:8000/v1/analyze-unit}") String endpoint
    ) {
        this.objectMapper = objectMapper;
        this.endpoint = URI.create(endpoint);
        this.httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NEVER)
            .proxy(DIRECT_CONNECTION)
            .build();
    }

    @Override
    public boolean isConfigured() {
        return endpoint.getScheme() != null && endpoint.getHost() != null;
    }

    @Override
    public Map<String, DecisionSuggestion> analyzeUnit(UnitAnalysisContext context) {
        if (context.evidence().isEmpty() || context.requirements().stream()
                .noneMatch(rule -> rule.rule() != null && !rule.rule().isBlank())) {
            return insufficient(context, INSUFFICIENT_REASON);
        }

        try {
            String requestBody = objectMapper.writeValueAsString(modelInput(context));
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(Duration.ofMinutes(10))
                    .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();
            LOGGER.info("Sending local AI request: version={}, endpoint={}, contentType={}, bodyBytes={}, preview={}",
                    httpClient.version(), sanitizedEndpoint(), "application/json",
                    requestBody.getBytes(StandardCharsets.UTF_8).length, sanitizedPreview(context));
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Local Python model returned HTTP " + response.statusCode()
                        + ": " + response.body());
            }
            return parseResponse(response.body(), context);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not encode the local model request", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not reach the local Python model", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Local Python model request was interrupted", exception);
        }
    }

    private String sanitizedEndpoint() {
        String authority = endpoint.getHost();
        if (endpoint.getPort() >= 0) {
            authority += ":" + endpoint.getPort();
        }
        return endpoint.getScheme() + "://" + authority + endpoint.getPath();
    }

    private String sanitizedPreview(UnitAnalysisContext context) {
        Map<String, Object> preview = Map.of(
                "unitId", "[redacted]",
                "chargeCount", context.charges().size(),
                "chargeTypes", context.charges().stream()
                        .map(UnitAnalysisContext.ChargeInput::chargeType).distinct().toList(),
                "evidenceCount", context.evidence().size(),
                "requirementCount", context.requirements().size());
        try {
            String json = objectMapper.writeValueAsString(preview);
            return json.length() <= 512 ? json : json.substring(0, 512);
        } catch (JsonProcessingException exception) {
            return "{\"preview\":\"unavailable\"}";
        }
    }

    Map<String, DecisionSuggestion> parseResponse(String json, UnitAnalysisContext context)
            throws JsonProcessingException {
        String cleanJson = json == null ? "" : json.trim();
        if (cleanJson.contains("```")) {
            int start = cleanJson.indexOf("{");
            int end = cleanJson.lastIndexOf("}");
            if (start >= 0 && end > start) {
                cleanJson = cleanJson.substring(start, end + 1);
            }
        }
        ModelResponse response = objectMapper.readValue(cleanJson, ModelResponse.class);
        Map<String, DecisionSuggestion> decisions = insufficient(context, INSUFFICIENT_REASON);
        if (response.decisions() == null) {
            return decisions;
        }

        Map<String, UnitAnalysisContext.ChargeInput> charges = context.charges().stream()
                .collect(Collectors.toMap(UnitAnalysisContext.ChargeInput::lineId, charge -> charge, (left, right) -> left));
        Map<String, UnitAnalysisContext.EvidenceInput> evidence = context.evidence().stream()
                .collect(Collectors.toMap(UnitAnalysisContext.EvidenceInput::recordId, item -> item, (left, right) -> left));
        Map<Long, UnitAnalysisContext.RequirementInput> rules = context.requirements().stream()
                .filter(item -> item.rule() != null && !item.rule().isBlank())
                .collect(Collectors.toMap(UnitAnalysisContext.RequirementInput::id, item -> item, (left, right) -> left));
        Set<String> seenChargeIds = new HashSet<>();

        for (ModelDecision candidate : response.decisions()) {
            if (candidate.chargeId() == null || !charges.containsKey(candidate.chargeId())) {
                continue;
            }
            if (!seenChargeIds.add(candidate.chargeId())) {
                decisions.put(candidate.chargeId(), new DecisionSuggestion(
                        DecisionType.INSUFFICIENT_EVIDENCE, "The local model returned duplicate decisions; review required."));
                continue;
            }

            DecisionType verdict = parseVerdict(candidate.verdict());
            List<String> evidenceIds = candidate.evidenceRecordIds() == null ? List.of() : candidate.evidenceRecordIds();
            List<Long> ruleIds = candidate.requirementIds() == null ? List.of() : candidate.requirementIds();
            String reason = candidate.reason() == null ? "" : candidate.reason().trim();
            if (verdict == null || reason.isBlank() || !evidence.keySet().containsAll(evidenceIds)
                    || !rules.keySet().containsAll(ruleIds)) {
                continue;
            }
            if (verdict != DecisionType.INSUFFICIENT_EVIDENCE && !hasSupport(
                    verdict, charges.get(candidate.chargeId()), evidenceIds, ruleIds, evidence, rules)) {
                continue;
            }

            String citations = evidenceIds.isEmpty() ? "" : " Evidence refs: " + String.join(", ", evidenceIds) + ".";
            if (!ruleIds.isEmpty()) {
                citations += " Rule refs: " + ruleIds.stream().map(String::valueOf).collect(Collectors.joining(", ")) + ".";
            }
            decisions.put(candidate.chargeId(), new DecisionSuggestion(verdict, limitReason(reason + citations)));
        }
        return decisions;
    }

    private boolean hasSupport(
            DecisionType verdict,
            UnitAnalysisContext.ChargeInput charge,
            List<String> evidenceIds,
            List<Long> ruleIds,
            Map<String, UnitAnalysisContext.EvidenceInput> evidence,
            Map<Long, UnitAnalysisContext.RequirementInput> rules
    ) {
        if (!"unit".equalsIgnoreCase(charge.granularity()) || evidenceIds.isEmpty() || ruleIds.isEmpty()) {
            return false;
        }
        LocalDate chargedDate = charge.chargedAt() == null ? charge.postedDate() : charge.chargedAt();
        if (chargedDate == null) {
            return false;
        }
        boolean rulesMatch = ruleIds.stream().map(rules::get).allMatch(rule -> rule != null
                && rule.rule() != null && !rule.rule().isBlank()
                && rule.chargeType() != null && charge.chargeType() != null
                && rule.chargeType().equalsIgnoreCase(charge.chargeType()));
        List<UnitAnalysisContext.EvidenceInput> cited = evidenceIds.stream().map(evidence::get).toList();
        boolean datedBeforeCharge = cited.stream().allMatch(item -> item.timestamp() != null
                && !item.timestamp().atZone(ZoneOffset.UTC).toLocalDate().isAfter(chargedDate));
        boolean stateSupportsVerdict = verdict == DecisionType.CONTESTED
                ? cited.stream().allMatch(item -> "PASS".equalsIgnoreCase(item.status()))
                : verdict == DecisionType.ACCEPTED
                    && cited.stream().anyMatch(item -> "FAIL".equalsIgnoreCase(item.status()));
        return rulesMatch && datedBeforeCharge && stateSupportsVerdict;
    }

    private DecisionType parseVerdict(String verdict) {
        if (verdict == null) {
            return null;
        }
        return switch (verdict.trim().toLowerCase(Locale.ROOT)) {
            case "contested" -> DecisionType.CONTESTED;
            case "accepted" -> DecisionType.ACCEPTED;
            case "insufficient_evidence" -> DecisionType.INSUFFICIENT_EVIDENCE;
            default -> null;
        };
    }

    private Map<String, Object> modelInput(UnitAnalysisContext context) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("unitId", context.unitId());
        input.put("charges", context.charges());
        input.put("evidence", context.evidence().stream().map(item -> Map.of(
                "recordId", item.recordId(),
                "sourceType", item.sourceType(),
                "requirement", item.requirement() == null ? "" : item.requirement(),
                "status", item.status() == null ? "" : item.status(),
                "finding", item.finding() == null ? "" : item.finding(),
                "timestamp", item.timestamp() == null ? "" : item.timestamp().toString()
        )).toList());
        input.put("requirements", context.requirements());
        return input;
    }

    private Map<String, DecisionSuggestion> insufficient(UnitAnalysisContext context, String reason) {
        Map<String, DecisionSuggestion> fallback = new LinkedHashMap<>();
        for (UnitAnalysisContext.ChargeInput charge : context.charges()) {
            fallback.put(charge.lineId(), new DecisionSuggestion(DecisionType.INSUFFICIENT_EVIDENCE, reason));
        }
        return fallback;
    }

    private String limitReason(String reason) {
        return reason.length() <= 1900 ? reason : reason.substring(0, 1900);
    }

    private record ModelResponse(List<ModelDecision> decisions) {
    }

    private record ModelDecision(String chargeId, String verdict, String reason,
                                 List<String> evidenceRecordIds, List<Long> requirementIds) {
    }
}