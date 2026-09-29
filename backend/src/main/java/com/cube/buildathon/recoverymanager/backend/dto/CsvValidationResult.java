package com.cube.buildathon.recoverymanager.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class CsvValidationResult {
    private boolean valid;
    private boolean headersValid;
    private int totalRows;
    private final List<String> missingColumns = new ArrayList<>();
    private final List<RowValidationError> rowErrors = new ArrayList<>();
    private final List<ParsedChargeRow> parsedRows = new ArrayList<>();
    private int validRows;
    private int invalidRows;

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public boolean areHeadersValid() {
        return headersValid;
    }

    public void setHeadersValid(boolean headersValid) {
        this.headersValid = headersValid;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public List<String> getMissingColumns() {
        return missingColumns;
    }

    public List<RowValidationError> getRowErrors() {
        return rowErrors;
    }

    public List<ParsedChargeRow> getParsedRows() {
        return parsedRows;
    }

    public int getValidRows() {
        return validRows;
    }

    public void setValidRows(int validRows) {
        this.validRows = validRows;
    }

    public int getInvalidRows() {
        return invalidRows;
    }

    public void setInvalidRows(int invalidRows) {
        this.invalidRows = invalidRows;
    }
}
