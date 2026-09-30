package com.cube.buildathon.recoverymanager.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

@Component
@Order(1)
public class PostgresRlsInitializer implements ApplicationRunner {
    private static final List<String> TENANT_TABLES = List.of(
            "analysis_runs", "charges", "decisions", "validation_issues", "evidence_records", "requirements",
            "reimbursements_received"
    );

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public PostgresRlsInitializer(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgresql")) {
                return;
            }
        }

        String tenantPolicy = "org_id = nullif(current_setting('app.current_org_id', true), '')";
        for (String table : TENANT_TABLES) {
            jdbcTemplate.execute("alter table " + table + " enable row level security");
            jdbcTemplate.execute("alter table " + table + " force row level security");
            jdbcTemplate.execute("drop policy if exists tenant_org_isolation on " + table);
            jdbcTemplate.execute("create policy tenant_org_isolation on " + table
                    + " using (" + tenantPolicy + ") with check (" + tenantPolicy + ")");
        }
    }
}