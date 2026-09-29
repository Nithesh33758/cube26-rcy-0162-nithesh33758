package com.cube.buildathon.recoverymanager.backend.exception;

import org.springframework.http.HttpStatus;

import java.util.List;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;
    private final List<String> details;

    public ApiException(HttpStatus status, String errorCode, String message) {
        this(status, errorCode, message, List.of());
    }

    public ApiException(HttpStatus status, String errorCode, String message, List<String> details) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.details = List.copyOf(details);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public List<String> getDetails() {
        return details;
    }
}