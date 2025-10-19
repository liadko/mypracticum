package com.practicum.admin.controller;

import com.practicum.admin.client.PracticumApiClient;
import com.practicum.admin.dto.BulkApproveRequest;
import com.practicum.admin.dto.BulkResultApproval;
import com.practicum.admin.dto.ImportResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/admin-portal")
public class AdminPortalController {
	PracticumApiClient practicumApiClient;

	AdminPortalController(PracticumApiClient practicumApiClient) {
		this.practicumApiClient = practicumApiClient;
	}

	@PostMapping("/students/import")
	public ImportResponse handleStudentImport(
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
		log.info("Handling student import. Filename: {}, DryRun: {}",
				file.getOriginalFilename(), dryRun);
		// The controller calls the Feign client, which calls the Go API
		return practicumApiClient.importStudents(file, dryRun);
	}
	@PostMapping("/entries/approve")
	public BulkResultApproval approveEntries(@RequestBody BulkApproveRequest req) {
		Boolean approved = (req.approved() == null) ? Boolean.TRUE : req.approved();
		log.info("Bulk approve: count={}, approved={}", req.ids().size(), approved);
		return practicumApiClient.bulkApprove(new BulkApproveRequest(req.ids(), approved));
	}

}
