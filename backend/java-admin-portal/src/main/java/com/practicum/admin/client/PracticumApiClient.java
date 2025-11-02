package com.practicum.admin.client;

import com.practicum.admin.dto.approve.BulkApproveRequest;
import com.practicum.admin.dto.approve.BulkApproveResult;
import com.practicum.admin.dto.student.StudentImportResponse;
import com.practicum.admin.dto.student.StudentResponse;
import com.practicum.admin.dto.manual_entry.BulkAddManualEntriesRequest;
import com.practicum.admin.dto.manual_entry.BulkAddManualEntriesResult;
import com.practicum.admin.dto.manual_entry.DeleteManualEntriesRequest;
import com.practicum.admin.dto.manual_entry.DeleteManualEntriesResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@FeignClient(name="go-practicum-api", url="${practicum.api.base-url}")
public interface PracticumApiClient {

	@PostMapping(value = "/admin/students/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    StudentImportResponse importStudents(
			@RequestPart("file") MultipartFile file,
			@RequestParam("dryRun") boolean dryRun
	);

	@PostMapping(value = "/admin/entries/approve",
			consumes = MediaType.APPLICATION_JSON_VALUE,
			produces = MediaType.APPLICATION_JSON_VALUE)
    BulkApproveResult bulkApprove(@RequestBody BulkApproveRequest request);

    /**
     * Calls the Go API's GET /admin/students endpoint.
     */
    @GetMapping(value = "/admin/students", produces = MediaType.APPLICATION_JSON_VALUE)
    List<StudentResponse> getStudents();

    /**
     * Calls the Go API's POST /admin/entries/manual endpoint.
     */
    @PostMapping(value = "/admin/entries/manual",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    BulkAddManualEntriesResult bulkAddManualEntries(
            @RequestBody BulkAddManualEntriesRequest request
    );


    /**
     * Calls the Go API's POST /admin/entries/manual/delete endpoint.
     * The Go backend will interpret the IDs as either entry_ids or batch_ids.
     */
    @PostMapping(value = "/admin/entries/manual/delete",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    DeleteManualEntriesResult deleteManualEntries(
            @RequestBody DeleteManualEntriesRequest request
    );
}
