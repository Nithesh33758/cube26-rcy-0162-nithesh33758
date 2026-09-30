package com.cube.buildathon.recoverymanager.backend.integration;

import com.cube.buildathon.recoverymanager.backend.config.EvidenceContractProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Component
public class EvidenceContractClient {
    private final RestClient restClient;
    private final EvidenceContractProperties properties;

    public EvidenceContractClient(RestClient.Builder builder, EvidenceContractProperties properties) {
        this.restClient = builder.build();
        this.properties = properties;
    }

    public List<EvidenceContractRecord> fetchRecords(
            String localOrgId,
            Instant since,
            EvidenceContractAgent agent
    ) {
        UUID expectedOrganizationId = properties.organizationUuidFor(localOrgId);
        validateRequestConfiguration();

        String cursorParameter = properties.getCursorRequestParameter() == null
                ? "" : properties.getCursorRequestParameter().trim();
        String cursor = null;
        Set<String> seenCursors = new HashSet<>();
        List<EvidenceContractRecord> records = new ArrayList<>();
        String sinceValue = since == null ? "" : since.toString();

        while (true) {
            EvidenceContractPage page = restClient.get()
                    .uri(pageUri(sinceValue, agent, cursor, cursorParameter))
                    .headers(this::applyAuthentication)
                    .retrieve()
                    .body(EvidenceContractPage.class);

            if (page == null) {
                return List.copyOf(records);
            }
            if (page.records() != null) {
                for (EvidenceContractRecord record : page.records()) {
                    validateOrganization(record, expectedOrganizationId);
                    records.add(record);
                }
            }

            cursor = page.nextCursor();
            if (cursor == null || cursor.isBlank()) {
                return List.copyOf(records);
            }
            if (cursorParameter.isBlank()) {
                throw new IllegalStateException(
                        "Evidence service returned next_cursor but no cursor request parameter is configured");
            }
            if (!seenCursors.add(cursor)) {
                throw new IllegalStateException("Evidence service repeated a pagination cursor");
            }
        }
    }

    private URI pageUri(String since, EvidenceContractAgent agent, String cursor, String cursorParameter) {
        String baseUrl = properties.getBaseUrl().trim().replaceAll("/+$", "");
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/v1/records")
                .queryParam("since", since)
                .queryParam("agent", agent.apiValue());
        if (cursor != null) {
            builder.queryParam(cursorParameter, cursor);
        }
        return builder.build().encode().toUri();
    }

    private void validateRequestConfiguration() {
        String baseUrl = properties.getBaseUrl() == null ? "" : properties.getBaseUrl().trim();
        if (baseUrl.isBlank()) {
            throw new IllegalStateException("Evidence service base URL is not configured");
        }
        URI uri = URI.create(baseUrl);
        if (uri.getHost() == null || !("http".equalsIgnoreCase(uri.getScheme())
                || "https".equalsIgnoreCase(uri.getScheme()))) {
            throw new IllegalStateException("Evidence service base URL must be an HTTP(S) URL");
        }

        String authenticationType = properties.getAuthenticationType() == null
                ? "" : properties.getAuthenticationType().trim().toLowerCase(Locale.ROOT);
        if (!Set.of("bearer", "header").contains(authenticationType)) {
            throw new IllegalStateException("Evidence service authentication type must be configured as bearer or header");
        }
        if (properties.getAuthenticationToken() == null || properties.getAuthenticationToken().isBlank()) {
            throw new IllegalStateException("Evidence service authentication token is not configured");
        }
        if ("header".equals(authenticationType)
                && (properties.getAuthenticationHeaderName() == null
                || properties.getAuthenticationHeaderName().isBlank())) {
            throw new IllegalStateException("Evidence service authentication header name is not configured");
        }
    }

    private void applyAuthentication(HttpHeaders headers) {
        String authenticationType = properties.getAuthenticationType().trim().toLowerCase(Locale.ROOT);
        String token = properties.getAuthenticationToken();
        if ("bearer".equals(authenticationType)) {
            headers.setBearerAuth(token);
        } else {
            headers.set(properties.getAuthenticationHeaderName().trim(), token);
        }
    }

    private void validateOrganization(EvidenceContractRecord record, UUID expectedOrganizationId) {
        if (record == null || record.organizationId() == null || record.organizationId().isBlank()) {
            throw new SecurityException("Evidence service returned a record without an organization id");
        }
        UUID recordOrganizationId;
        try {
            recordOrganizationId = UUID.fromString(record.organizationId());
        } catch (IllegalArgumentException exception) {
            throw new SecurityException("Evidence service returned a record with an invalid organization id", exception);
        }
        if (!expectedOrganizationId.equals(recordOrganizationId)) {
            throw new SecurityException("Evidence service returned a record outside the requested organization");
        }
    }
}