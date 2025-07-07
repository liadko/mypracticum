package com.liad.mypracticum.otp.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class OtpExceptionHandler {

	public record ApiError(int status, String error, String message, String path) {}

	@ExceptionHandler(InvalidOtpException.class)
	@ResponseStatus(HttpStatus.UNAUTHORIZED)
	public ApiError handleNotFound(InvalidOtpException ex, HttpServletRequest req) {
		return new ApiError(
				HttpStatus.UNAUTHORIZED.value(),
				HttpStatus.UNAUTHORIZED.getReasonPhrase(),
				ex.getMessage(),
				req.getRequestURI()
		);
	}


	@ExceptionHandler({OtpStorageException.class, OtpSendException.class})
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ApiError handleServerErrors(RuntimeException ex, HttpServletRequest req) {
		return new ApiError(
				HttpStatus.INTERNAL_SERVER_ERROR.value(),
				HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
				ex.getMessage(),
				req.getRequestURI()
		);
	}


	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public List<String> onValidationError(MethodArgumentNotValidException ex) {
		return ex.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.distinct()
				.collect(Collectors.toList());
	}
}