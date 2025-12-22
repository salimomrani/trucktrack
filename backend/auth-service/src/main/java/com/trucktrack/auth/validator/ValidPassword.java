package com.trucktrack.auth.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom annotation for password validation.
 * T015: Create ValidPassword annotation
 * Feature: 002-admin-panel
 *
 * Password requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 */
@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {

    String message() default "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
