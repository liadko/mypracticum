package com.practicum.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BulkApproveRequest(
		List<UUID> ids,   // entry UUIDs
		Boolean approved            // optional; defaults to true on server
) {}