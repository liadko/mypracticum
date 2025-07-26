package com.liad.mypracticum.otp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendOtpRequest(

		@NotBlank(message = "Email must not be blank")
		@Email(message = "Must be a valid email address")
		String email


) {
}