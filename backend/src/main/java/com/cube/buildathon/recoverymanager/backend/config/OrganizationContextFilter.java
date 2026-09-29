package com.cube.buildathon.recoverymanager.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Pattern;

@Component
public class OrganizationContextFilter extends OncePerRequestFilter {
    private static final Pattern VALID_ORG_ID = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]{0,119}");

    private final String defaultOrgId;

    public OrganizationContextFilter(@Value("${recovery-manager.default-org-id}") String defaultOrgId) {
        this.defaultOrgId = defaultOrgId;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(request.getContextPath() + "/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String orgId = request.getHeader("X-Org-Id");
        if (orgId == null || orgId.isBlank()) {
            orgId = defaultOrgId;
        }
        orgId = orgId.trim();

        if (!VALID_ORG_ID.matcher(orgId).matches()) {
            response.sendError(HttpStatus.BAD_REQUEST.value(), "Invalid X-Org-Id header");
            return;
        }

        OrganizationContext.setOrgId(orgId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            OrganizationContext.clear();
        }
    }
}