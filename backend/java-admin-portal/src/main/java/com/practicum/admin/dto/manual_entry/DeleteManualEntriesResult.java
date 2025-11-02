package com.practicum.admin.dto.manual_entry;

/**
 * Response payload from the Go API after deletion.
 * This provides a clear summary of what was deleted.
 * (Your Go backend should be updated to return this structure).
 */
public record DeleteManualEntriesResult(
        int entriesDeleted,
        int batchesDeleted
) {}