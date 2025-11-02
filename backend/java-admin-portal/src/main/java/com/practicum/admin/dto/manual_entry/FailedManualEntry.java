package com.practicum.admin.dto.manual_entry;

/**
 * Represents a single failed entry in the response.
 */
public record FailedManualEntry(
        NewManualEntryInput input,
        String error
) {}