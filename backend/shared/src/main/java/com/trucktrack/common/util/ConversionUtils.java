package com.trucktrack.common.util;

import org.apache.commons.lang3.math.NumberUtils;

import java.math.BigDecimal;

/**
 * Utility class for null-safe type conversions.
 *
 * For String to primitive conversions with default values, use Apache Commons Lang3 directly:
 * - NumberUtils.toInt(String, int defaultValue)
 * - NumberUtils.toLong(String, long defaultValue)
 * - NumberUtils.toDouble(String, double defaultValue)
 * - NumberUtils.isCreatable(String) - check if string is a valid number
 *
 * @see org.apache.commons.lang3.math.NumberUtils
 */
public final class ConversionUtils {

    private ConversionUtils() {
    }

    /**
     * Double → BigDecimal (null-safe).
     */
    public static BigDecimal toBigDecimal(Double value) {
        return value != null ? BigDecimal.valueOf(value) : null;
    }

    /**
     * BigDecimal → Double (null-safe).
     */
    public static Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    /**
     * String → BigDecimal (null-safe, validates input).
     */
    public static BigDecimal toBigDecimal(String value) {
        return isValidNumber(value) ? new BigDecimal(value) : null;
    }

    /**
     * String → Double (null-safe, validates input).
     */
    public static Double toDouble(String value) {
        return isValidNumber(value) ? NumberUtils.toDouble(value) : null;
    }

    /**
     * String → Integer (null-safe, validates input).
     */
    public static Integer toInteger(String value) {
        return isValidNumber(value) ? NumberUtils.toInt(value) : null;
    }

    /**
     * String → Long (null-safe, validates input).
     */
    public static Long toLong(String value) {
        return isValidNumber(value) ? NumberUtils.toLong(value) : null;
    }

    private static boolean isValidNumber(String value) {
        return value != null && !value.isBlank() && NumberUtils.isCreatable(value);
    }
}
