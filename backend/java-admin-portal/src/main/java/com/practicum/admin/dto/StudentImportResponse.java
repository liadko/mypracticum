package com.practicum.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Maps to the BulkStudentsResult struct from the Go backend.
 */
public record StudentImportResponse(
		@JsonProperty("created") int created,
		@JsonProperty("updated") int updated,
		@JsonProperty("skipped") int skipped,

		// Note: List<RowError> is the Java equivalent of Go's []RowError
		@JsonProperty("errors") List<StudentRowError> errors,

		@JsonProperty("parseWarnings") List<StudentRowError> parseWarnings
) {}