package com.liad.mypracticum.otp.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.Length;

public record VerifyOtpRequest(
		@NotBlank(message = "Email must not be blank")
		@Email(message = "Must be a valid email address")
		String email,

		@NotBlank(message = "Code must not be blank")
		@Size(min = 6, max = 6, message = "Code must be exactly 6 characters")
		@Pattern(regexp = "\\d{6}", message = "Code must be numeric")
		String code
) {
}


