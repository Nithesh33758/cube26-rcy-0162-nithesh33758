package com.cube.buildathon.recoverymanager.backend.dto;

import java.util.List;

public class ApiError {
    private final String error;
    private final String message;
    private final List<String> details;

    public ApiError(String error, String message, List<String> details) {
        this.error = error;
        this.message = message;
        this.details = details;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public List<String> getDetails() {
        return details;
    }
}
