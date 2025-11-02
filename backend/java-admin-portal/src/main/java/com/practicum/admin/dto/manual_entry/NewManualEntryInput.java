package com.practicum.admin.dto.manual_entry;

/**
 * Represents the Go domain.NewManualEntry, used in the failure report.
 * Field names must match the JSON (PascalCase) from Go.
 */
public record NewManualEntryInput(
        String UserID,
        int Hours,
        String Cause,
        String Type
) {}