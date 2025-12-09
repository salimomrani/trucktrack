package com.trucktrack.common.exception;

/**
 * Exception thrown when a user is not authorized to access a resource
 * T041: Create common exception classes in backend/shared
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
