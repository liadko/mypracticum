package com.practicum.admin.controller;

import feign.FeignException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {


	@ExceptionHandler(FeignException.class)
	public ResponseEntity<String> handleFeignException(FeignException e) {


		String errorBody = e.contentUTF8();

		log.warn("Go API Error ({}): Forwarding error to admin client. Body: {}",
				e.status(), errorBody);


		return ResponseEntity.status(e.status()).body(errorBody);
	}


	@ExceptionHandler(Exception.class)
	public ResponseEntity<String> handleGlobalException(Exception e) {
		log.error("Unhandled internal Spring exception: {}", e.getMessage(), e);

		// Return a generic error to the frontend
		return ResponseEntity
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body("{\"error\": \"An internal error occurred in the Spring admin portal.\"}");
	}
}