package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.dto.CsvValidationResult;
import com.cube.buildathon.recoverymanager.backend.dto.ParsedChargeRow;
import com.cube.buildathon.recoverymanager.backend.dto.RowValidationError;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CsvValidationService {
    private static final List<Column> LEGACY_REQUIRED_COLUMNS = List.of(
        new Column("lineId", "line_id", "Line ID"),
        new Column("reportType", "report_type", "Report Type"),
        new Column("unitId", "unit_id", "Unit Id"),
        new Column("orgId", "org_id", "org id"),
        new Column("sku", "sku", "sku"),
        new Column("fnsku", "fnsku", "fnsku"),
        new Column("fbaShipmentId", "fba_shipment_id", "fba shipment id"),
        new Column("orderId", "order_id", "order id"),
        new Column("chargeType", "charge_type", "charge type"),
        new Column("quantity", "quantity", "Quantity"),
        new Column("amount", "amount_usd", "Ammount"),
        new Column("postedDate", "posted_date", "posted date")
    );
    private static final List<Column> CONTRACT_REQUIRED_COLUMNS = List.of(
        new Column("lineId", "charge_id", "charge_id"),
        new Column("chargeType", "charge_type", "charge_type"),
        new Column("chargeSubtype", "charge_subtype", "charge_subtype"),
        new Column("postedDate", "charged_at", "charged_at"),
        new Column("granularity", "granularity", "granularity"),
        new Column("quantity", "quantity", "quantity"),
        new Column("currency", "currency", "currency"),
        new Column("amount", "amount_total", "amount_total"),
        new Column("description", "description", "description")
    );
    private static final List<Column> CONTRACT_OPTIONAL_COLUMNS = List.of(
        new Column("fbaShipmentId", "shipment_id", "shipment_id"),
        new Column("orderId", "amazon_order_id", "amazon_order_id"),
        new Column("sku", "sku", "sku"),
        new Column("fnsku", "fnsku", "fnsku"),
        new Column("asin", "asin", "asin"),
        new Column("amountPerUnit", "amount_per_unit", "amount_per_unit")
    );

    public CsvValidationResult validateCsv(MultipartFile file) {
        CsvValidationResult result = new CsvValidationResult();
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();

        try (CSVParser parser = CSVParser.parse(file.getInputStream(), StandardCharsets.UTF_8, format)) {
            Map<String, String> actualHeaders = new LinkedHashMap<>();
            parser.getHeaderMap().keySet().forEach(header -> actualHeaders.put(header.trim(), header));
            boolean contractSchema = actualHeaders.containsKey("charge_id");
            boolean legacyHeaders = actualHeaders.containsKey("Line ID") || actualHeaders.containsKey("Ammount");
            Map<String, String> resolvedHeaders = new LinkedHashMap<>();

            List<Column> requiredColumns = contractSchema ? CONTRACT_REQUIRED_COLUMNS : LEGACY_REQUIRED_COLUMNS;
            for (Column column : requiredColumns) {
                String actualHeader = actualHeaders.get(column.currentName());
                if (actualHeader == null && !contractSchema) {
                    actualHeader = actualHeaders.get(column.legacyName());
                }
                if (actualHeader == null) {
                    result.getMissingColumns().add(!contractSchema && legacyHeaders
                            ? column.legacyName() : column.currentName());
                } else {
                    resolvedHeaders.put(column.field(), actualHeader);
                }
            }
            if (contractSchema) {
                for (Column column : CONTRACT_OPTIONAL_COLUMNS) {
                    String actualHeader = actualHeaders.get(column.currentName());
                    if (actualHeader != null) {
                        resolvedHeaders.put(column.field(), actualHeader);
                    }
                }
            }

            if (!result.getMissingColumns().isEmpty()) {
                result.setHeadersValid(false);
                for (CSVRecord ignored : parser) {
                    result.setTotalRows(result.getTotalRows() + 1);
                }
                result.setValid(false);
                return result;
            }
            result.setHeadersValid(true);

            for (CSVRecord record : parser) {
                result.setTotalRows(result.getTotalRows() + 1);
                int rowNumber = (int) record.getRecordNumber() + 1;
                List<RowValidationError> rowErrors = new ArrayList<>();
                if (!record.isConsistent()) {
                    result.getRowErrors().add(new RowValidationError(rowNumber, "row", "Column count does not match the header"));
                    result.setInvalidRows(result.getInvalidRows() + 1);
                    continue;
                }

                validateRequiredText(record, resolvedHeaders, "lineId", "charge_id", rowNumber, rowErrors);
                validateRequiredText(record, resolvedHeaders, "chargeType", "charge_type", rowNumber, rowErrors);
                if (contractSchema) {
                    validateRequiredText(record, resolvedHeaders, "chargeSubtype", "charge_subtype", rowNumber, rowErrors);
                    validateRequiredText(record, resolvedHeaders, "currency", "currency", rowNumber, rowErrors);
                    validateRequiredText(record, resolvedHeaders, "description", "description", rowNumber, rowErrors);
                    String granularity = value(record, resolvedHeaders, "granularity");
                    if (!List.of("unit", "shipment", "order").contains(granularity)) {
                        rowErrors.add(new RowValidationError(rowNumber, "granularity",
                                "Granularity must be unit, shipment, or order"));
                    }
                } else {
                    validateRequiredText(record, resolvedHeaders, "unitId", "Unit Id", rowNumber, rowErrors);
                    validateRequiredText(record, resolvedHeaders, "orgId", "org id", rowNumber, rowErrors);
                }

                Integer quantity = parseQuantity(record, resolvedHeaders, rowNumber, rowErrors);
                BigDecimal amount = parseAmount(record, resolvedHeaders, rowNumber, rowErrors);
                LocalDate postedDate = parseDate(record, resolvedHeaders, rowNumber, rowErrors);
                BigDecimal amountPerUnit = contractSchema
                        ? parseOptionalAmount(record, resolvedHeaders, "amountPerUnit", "amount_per_unit", rowNumber, rowErrors)
                        : null;

                if (!rowErrors.isEmpty()) {
                    result.getRowErrors().addAll(rowErrors);
                    result.setInvalidRows(result.getInvalidRows() + 1);
                    continue;
                }

                result.getParsedRows().add(new ParsedChargeRow(
                        rowNumber,
                        value(record, resolvedHeaders, "lineId"),
                        value(record, resolvedHeaders, "reportType"),
                        value(record, resolvedHeaders, "unitId"),
                        value(record, resolvedHeaders, "orgId"),
                        value(record, resolvedHeaders, "sku"),
                        value(record, resolvedHeaders, "fnsku"),
                        value(record, resolvedHeaders, "fbaShipmentId"),
                        value(record, resolvedHeaders, "orderId"),
                        value(record, resolvedHeaders, "chargeType"),
                        quantity,
                        amount,
                        postedDate,
                        value(record, resolvedHeaders, "chargeSubtype"),
                        contractSchema ? value(record, resolvedHeaders, "granularity") : "unit",
                        value(record, resolvedHeaders, "asin"),
                        contractSchema ? value(record, resolvedHeaders, "currency") : "USD",
                        amountPerUnit,
                        value(record, resolvedHeaders, "description")));
                result.setValidRows(result.getValidRows() + 1);
            }

            result.setValid(result.getInvalidRows() == 0);
            return result;
        } catch (IOException exception) {
            throw new UncheckedIOException("Unable to read uploaded CSV", exception);
        }
    }

    private void validateRequiredText(
            CSVRecord record,
            Map<String, String> headers,
            String field,
            String displayName,
            int rowNumber,
            List<RowValidationError> errors
    ) {
        if (value(record, headers, field) == null) {
            errors.add(new RowValidationError(rowNumber, errorField(headers, field, displayName), displayName + " is required"));
        }
    }

    private Integer parseQuantity(
            CSVRecord record,
            Map<String, String> headers,
            int rowNumber,
            List<RowValidationError> errors
    ) {
        try {
            int quantity = Integer.parseInt(value(record, headers, "quantity"));
            if (quantity <= 0) {
                throw new NumberFormatException("quantity must be positive");
            }
            return quantity;
        } catch (NumberFormatException | NullPointerException exception) {
            errors.add(new RowValidationError(rowNumber, errorField(headers, "quantity", "Quantity"), "Quantity must be a positive integer"));
            return null;
        }
    }

    private BigDecimal parseAmount(
            CSVRecord record,
            Map<String, String> headers,
            int rowNumber,
            List<RowValidationError> errors
    ) {
        try {
            return new BigDecimal(value(record, headers, "amount"));
        } catch (NumberFormatException | NullPointerException exception) {
            errors.add(new RowValidationError(rowNumber, errorField(headers, "amount", "Ammount"), "Amount must be numeric"));
            return null;
        }
    }

    private BigDecimal parseOptionalAmount(
            CSVRecord record,
            Map<String, String> headers,
            String field,
            String displayName,
            int rowNumber,
            List<RowValidationError> errors
    ) {
        String rawValue = value(record, headers, field);
        if (rawValue == null) {
            return null;
        }
        try {
            return new BigDecimal(rawValue);
        } catch (NumberFormatException exception) {
            errors.add(new RowValidationError(rowNumber, displayName, "Amount per unit must be numeric"));
            return null;
        }
    }

    private LocalDate parseDate(
            CSVRecord record,
            Map<String, String> headers,
            int rowNumber,
            List<RowValidationError> errors
    ) {
        try {
            return LocalDate.parse(value(record, headers, "postedDate"));
        } catch (DateTimeParseException | NullPointerException exception) {
            errors.add(new RowValidationError(rowNumber, errorField(headers, "postedDate", "posted date"), "Date must use ISO format yyyy-MM-dd"));
            return null;
        }
    }

    private String value(CSVRecord record, Map<String, String> headers, String field) {
        String header = headers.get(field);
        if (header == null) {
            return null;
        }
        String value = record.get(header);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String errorField(Map<String, String> headers, String field, String fallback) {
        return headers.getOrDefault(field, fallback);
    }

    private record Column(String field, String currentName, String legacyName) {
    }
}
