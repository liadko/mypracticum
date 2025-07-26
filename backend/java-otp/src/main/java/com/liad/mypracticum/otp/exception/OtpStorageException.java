package com.liad.mypracticum.otp.exception;

public class OtpStorageException extends RuntimeException {
	public OtpStorageException(String email, Throwable cause) {
		super("Failed to store OTP for " + email, cause);
	}
}