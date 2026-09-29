package com.cube.buildathon.recoverymanager.backend.service;

import com.cube.buildathon.recoverymanager.backend.dto.ParsedReimbursementRow;
import com.cube.buildathon.recoverymanager.backend.exception.ApiException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class ReimbursementCsvParser {
    private static final List<String> REQUIRED_HEADERS = List.of(
            "reimbursement_id", "approval_date", "sku", "reason", "currency", "amount_per_unit",
            "amount_total", "quantity_reimbursed_cash", "quantity_reimbursed_inventory");

    public List<ParsedReimbursementRow> parse(MultipartFile file) {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();

        try (CSVParser parser = CSVParser.parse(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8, format)) {
            Set<String> headers = new LinkedHashSet<>();
            parser.getHeaderMap().keySet().forEach(header -> headers.add(header.trim()));
            List<String> missingHeaders = REQUIRED_HEADERS.stream().filter(header -> !headers.contains(header)).toList();
            if (!missingHeaders.isEmpty()) {
                throw invalid("Required reimbursement columns are missing", missingHeaders);
            }

            List<ParsedReimbursementRow> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                int rowNumber = (int) record.getRecordNumber() + 1;
                if (!record.isConsistent()) {
                    throw invalid("Reimbursement row has a different number of columns", List.of("row " + rowNumber));
                }
                rows.add(parseRow(record, rowNumber));
            }
            if (rows.isEmpty()) {
                throw invalid("The reimbursement report contains no data rows", List.of());
            }
            return rows;
        } catch (ApiException exception) {
            throw exception;
        } catch (IOException | IllegalArgumentException exception) {
            throw invalid("The reimbursement report could not be read", List.of());
        }
    }

    private ParsedReimbursementRow parseRow(CSVRecord record, int rowNumber) {
        String reimbursementId = required(record, "reimbursement_id", rowNumber);
        String sku = required(record, "sku", rowNumber);
        String reason = required(record, "reason", rowNumber);
        String currency = required(record, "currency", rowNumber);
        LocalDate approvalDate = parseDate(record, rowNumber);
        BigDecimal amountPerUnit = parseDecimal(record, "amount_per_unit", rowNumber);
        BigDecimal amountTotal = parseDecimal(record, "amount_total", rowNumber);
        int quantityCash = parseQuantity(record, "quantity_reimbursed_cash", rowNumber);
        int quantityInventory = parseQuantity(record, "quantity_reimbursed_inventory", rowNumber);

        return new ParsedReimbursementRow(rowNumber, reimbursementId, optional(record, "case_id"), approvalDate,
                optional(record, "amazon_order_id"), sku, optional(record, "fnsku"), optional(record, "asin"),
                reason, optional(record, "condition"), currency, amountPerUnit, amountTotal, quantityCash,
                quantityInventory, optional(record, "original_reimbursement_id"));
    }

    private String required(CSVRecord record, String field, int rowNumber) {
        String value = optional(record, field);
        if (value == null) {
            throw invalid("A required value is missing", List.of("row " + rowNumber + ": " + field));
        }
        return value;
    }

    private String optional(CSVRecord record, String field) {
        if (!record.isMapped(field)) {
            return null;
        }
        String value = record.get(field).trim();
        return value.isEmpty() ? null : value;
    }

    private LocalDate parseDate(CSVRecord record, int rowNumber) {
        try {
            return LocalDate.parse(required(record, "approval_date", rowNumber));
        } catch (DateTimeParseException exception) {
            throw invalid("Approval date must use ISO format yyyy-MM-dd",
                    List.of("row " + rowNumber + ": approval_date"));
        }
    }

    private BigDecimal parseDecimal(CSVRecord record, String field, int rowNumber) {
        try {
            return new BigDecimal(required(record, field, rowNumber));
        } catch (NumberFormatException exception) {
            throw invalid("Reimbursement amounts must be numeric", List.of("row " + rowNumber + ": " + field));
        }
    }

    private int parseQuantity(CSVRecord record, String field, int rowNumber) {
        try {
            int quantity = Integer.parseInt(required(record, field, rowNumber));
            if (quantity < 0) {
                throw new NumberFormatException("negative quantity");
            }
            return quantity;
        } catch (NumberFormatException exception) {
            throw invalid("Reimbursed quantities must be non-negative integers",
                    List.of("row " + rowNumber + ": " + field));
        }
    }

    private ApiException invalid(String message, List<String> details) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_REIMBURSEMENT_REPORT", message, details);
    }
}