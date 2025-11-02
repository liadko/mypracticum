package com.practicum.admin.dto.manual_entry;

import java.util.List;

/**
 * The top-level request body for the bulk manual entry endpoint.
 * Matches the 'payload' in your admin.js.
 */
public record BulkAddManualEntriesRequest(
        List<ManualEntryRequest> entries
) {}