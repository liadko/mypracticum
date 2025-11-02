package com.practicum.admin.dto.manual_entry;

/**
 * Represents a single item in the bulk manual entry request.
 * Matches the 'entriesPayload' in your admin.js.
 */
public record ManualEntryRequest(
        String userId,
        int hours,
        String cause,
        String type
) {}

