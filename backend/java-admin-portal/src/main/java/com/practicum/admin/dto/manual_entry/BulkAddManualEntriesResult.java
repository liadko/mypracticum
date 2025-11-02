package com.practicum.admin.dto.manual_entry;

import java.util.List;

/**
 * Represents the result summary from the Go service.
 * Matches the service.BulkAddManualEntriesResult struct.
 */
public record BulkAddManualEntriesResult(
        int createdCount,
        int failedCount,
        List<FailedManualEntry> failures
) {}





