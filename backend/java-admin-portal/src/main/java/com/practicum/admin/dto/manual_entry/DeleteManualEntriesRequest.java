package com.practicum.admin.dto.manual_entry;

import java.util.List;

/**
 * Request payload to delete manual entries or batches.
 * Matches the { "ids": [...] } payload from admin.js.
 */
public record DeleteManualEntriesRequest(
        List<String> ids
) {}