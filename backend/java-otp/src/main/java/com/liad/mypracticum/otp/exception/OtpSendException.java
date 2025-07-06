package com.liad.mypracticum.otp.exception;

public class OtpSendException extends RuntimeException {
	public OtpSendException(String email, Throwable cause) {
		super("Failed to send OTP to " + email, cause);
	}
}