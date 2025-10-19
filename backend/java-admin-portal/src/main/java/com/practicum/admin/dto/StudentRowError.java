package com.practicum.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Maps to the RowError struct from the Go backend.
 */
public record StudentRowError(
		@JsonProperty("row") int row,
		@JsonProperty("email") String email,
		@JsonProperty("err") String err
) {}