package com.practicum.admin.client;

import com.practicum.admin.dto.BulkApproveRequest;
import com.practicum.admin.dto.BulkResultApproval;
import com.practicum.admin.dto.ImportResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name="go-practicum-api", url="${practicum.api.base-url}")
public interface PracticumApiClient {

	@PostMapping(value = "/admin/students/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ImportResponse importStudents(
			@RequestPart("file") MultipartFile file,
			@RequestParam("dryRun") boolean dryRun
	);

	@PostMapping(value = "/admin/entries/approve",
			consumes = MediaType.APPLICATION_JSON_VALUE,
			produces = MediaType.APPLICATION_JSON_VALUE)
	BulkResultApproval bulkApprove(@RequestBody BulkApproveRequest request);

}
