package com.trucktrack.auth.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator for password policy enforcement.
 * T016: Create PasswordValidator
 * Feature: 002-admin-panel
 *
 * Rules:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 */
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final int MIN_LENGTH = 8;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        // Check all rules
        boolean hasMinLength = password.length() >= MIN_LENGTH;
        boolean hasUppercase = UPPERCASE_PATTERN.matcher(password).find();
        boolean hasLowercase = LOWERCASE_PATTERN.matcher(password).find();
        boolean hasDigit = DIGIT_PATTERN.matcher(password).find();

        if (hasMinLength && hasUppercase && hasLowercase && hasDigit) {
            return true;
        }

        // Build custom error message with specific violations
        context.disableDefaultConstraintViolation();
        StringBuilder message = new StringBuilder("Password must have: ");
        boolean needsComma = false;

        if (!hasMinLength) {
            message.append("at least ").append(MIN_LENGTH).append(" characters");
            needsComma = true;
        }
        if (!hasUppercase) {
            if (needsComma) message.append(", ");
            message.append("1 uppercase letter");
            needsComma = true;
        }
        if (!hasLowercase) {
            if (needsComma) message.append(", ");
            message.append("1 lowercase letter");
            needsComma = true;
        }
        if (!hasDigit) {
            if (needsComma) message.append(", ");
            message.append("1 digit");
        }

        context.buildConstraintViolationWithTemplate(message.toString())
            .addConstraintViolation();

        return false;
    }

    /**
     * Static method for programmatic validation (useful in services).
     */
    public static ValidationResult validate(String password) {
        if (password == null || password.isEmpty()) {
            return new ValidationResult(false, "Password is required");
        }

        boolean hasMinLength = password.length() >= MIN_LENGTH;
        boolean hasUppercase = UPPERCASE_PATTERN.matcher(password).find();
        boolean hasLowercase = LOWERCASE_PATTERN.matcher(password).find();
        boolean hasDigit = DIGIT_PATTERN.matcher(password).find();

        if (hasMinLength && hasUppercase && hasLowercase && hasDigit) {
            return new ValidationResult(true, null);
        }

        StringBuilder message = new StringBuilder("Password must have: ");
        boolean needsComma = false;

        if (!hasMinLength) {
            message.append("at least ").append(MIN_LENGTH).append(" characters");
            needsComma = true;
        }
        if (!hasUppercase) {
            if (needsComma) message.append(", ");
            message.append("1 uppercase letter");
            needsComma = true;
        }
        if (!hasLowercase) {
            if (needsComma) message.append(", ");
            message.append("1 lowercase letter");
            needsComma = true;
        }
        if (!hasDigit) {
            if (needsComma) message.append(", ");
            message.append("1 digit");
        }

        return new ValidationResult(false, message.toString());
    }

    /**
     * Result of password validation.
     */
    public record ValidationResult(boolean valid, String errorMessage) {
        public boolean isValid() {
            return valid;
        }
    }
}
