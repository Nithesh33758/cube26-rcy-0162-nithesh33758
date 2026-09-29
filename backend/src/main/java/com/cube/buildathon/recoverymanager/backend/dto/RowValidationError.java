package com.cube.buildathon.recoverymanager.backend.dto;

public class RowValidationError {
    private int row;
    private String field;
    private String error;

    public RowValidationError(int row, String field, String error) {
        this.row = row;
        this.field = field;
        this.error = error;
    }

    public int getRow() {
        return row;
    }

    public String getField() {
        return field;
    }

    public String getError() {
        return error;
    }
}
