package com.trucktrack.location.converter;

import com.trucktrack.location.model.TruckStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter for TruckStatus enum to handle PostgreSQL ENUM type
 */
@Converter
public class TruckStatusConverter implements AttributeConverter<TruckStatus, String> {

    @Override
    public String convertToDatabaseColumn(TruckStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public TruckStatus convertToEntityAttribute(String dbData) {
        if (dbData == null ||dbData.trim().isEmpty()) {
            return null;
        }
        return TruckStatus.valueOf(dbData.toUpperCase());
    }
}
