package com.practicum.admin.dto;

/**
 * Represents a single student in the list for the admin portal.
 * This matches what the Go API's /admin/students endpoint returns
 * and what your admin.js frontend expects.
 *
 * (You may want to add @JsonIgnoreProperties(ignoreUnknown = true)
 * if the Go API sends extra fields like 'signature' that you
 * don't need in this view).
 */
public record UserResponse(
        String id,
        String firstName,
        String lastName,
        String email
) {}