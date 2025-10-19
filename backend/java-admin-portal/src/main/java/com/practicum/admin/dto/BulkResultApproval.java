package com.practicum.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record BulkResultApproval(
		int total,
		int succeeded,
		@JsonProperty("notFound") List<String> notFound,
		List<RowError> errors
) {
	public record RowError(String id, String err) {}
}