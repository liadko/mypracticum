package com.practicum.admin.dto.student;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Maps to the BulkStudentsResult struct from the Go backend.
 */
public record StudentImportResponse(
		@JsonProperty("created") int created,
		@JsonProperty("failed") int failed,
		@JsonProperty("skipped") int skipped,

		@JsonProperty("errors") List<StudentRowError> errors,

		@JsonProperty("parseWarnings") List<StudentRowError> parseWarnings
) {}