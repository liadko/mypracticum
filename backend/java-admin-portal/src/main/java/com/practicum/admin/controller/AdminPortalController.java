package com.practicum.admin.controller;

import com.practicum.admin.client.PracticumApiClient;
import com.practicum.admin.dto.student.StudentResponse;
import com.practicum.admin.dto.approve.BulkApproveRequest;
import com.practicum.admin.dto.approve.BulkApproveResult;
import com.practicum.admin.dto.student.StudentImportResponse;
import com.practicum.admin.dto.manual_entry.BulkAddManualEntriesRequest;
import com.practicum.admin.dto.manual_entry.BulkAddManualEntriesResult;
import com.practicum.admin.dto.manual_entry.DeleteManualEntriesRequest;
import com.practicum.admin.dto.manual_entry.DeleteManualEntriesResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/admin-portal")
public class AdminPortalController {
	PracticumApiClient practicumApiClient;

	AdminPortalController(PracticumApiClient practicumApiClient) {
		this.practicumApiClient = practicumApiClient;
	}

	@PostMapping("/students/import")
	public StudentImportResponse handleStudentImport(
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
		log.info("Handling student import. Filename: {}, DryRun: {}",
				file.getOriginalFilename(), dryRun);
		// The controller calls the Feign client, which calls the Go API
		return practicumApiClient.importStudents(file, dryRun);
	}

	@PostMapping("/entries/approve")
	public BulkApproveResult approveEntries(@RequestBody BulkApproveRequest req) {
		Boolean approved = (req.approved() == null) ? Boolean.TRUE : req.approved();
		log.info("Bulk approve: count={}, approved={}", req.ids().size(), approved);
		return practicumApiClient.bulkApprove(new BulkApproveRequest(req.ids(), approved));
	}

    /**
     * Endpoint for the admin portal frontend to fetch all students.
     * (Corresponds to loadInitialData() in admin.js)
     */
    @GetMapping("/students")
    public List<StudentResponse> getStudents() {
        log.info("Fetching all students for admin portal");
        return practicumApiClient.getStudents();
    }

    /**
     * Endpoint for the admin portal frontend to bulk-add manual entries.
     * (Corresponds to handleGroupSubmit() in admin.js)
     */
    @PostMapping("/entries/manual")
    public BulkAddManualEntriesResult handleBulkManualEntries(
            @RequestBody BulkAddManualEntriesRequest req) {
        log.info("Handling bulk manual entry add. Count: {}", req.entries().size());
        // The Feign client calls the Go API
        return practicumApiClient.bulkAddManualEntries(req);
    }

    /**
     * Endpoint for the admin portal frontend to delete manual entries by ID or Batch ID.
     * (Corresponds to handleDeleteManualSubmit() in admin.js)
     */
    @PostMapping("/entries/manual/delete")
    public DeleteManualEntriesResult handleDeleteManualEntries(
            @RequestBody DeleteManualEntriesRequest req) {
        log.info("Handling delete request for {} manual entry/batch IDs.", req.ids().size());
        // The Feign client calls the Go API
        return practicumApiClient.deleteManualEntries(req);
    }

}
