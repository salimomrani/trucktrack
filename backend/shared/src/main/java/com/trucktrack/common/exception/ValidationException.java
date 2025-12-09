package com.trucktrack.common.exception;

import java.util.Map;

/**
 * Exception thrown when input validation fails
 * T041: Create common exception classes in backend/shared
 */
public class ValidationException extends RuntimeException {

    private Map<String, String> validationErrors;

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String message, Map<String, String> validationErrors) {
        super(message);
        this.validationErrors = validationErrors;
    }

    public Map<String, String> getValidationErrors() {
        return validationErrors;
    }
}
