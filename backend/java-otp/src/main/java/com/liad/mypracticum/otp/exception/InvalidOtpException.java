// OtpMismatchException.java
package com.liad.mypracticum.otp.exception;

public class InvalidOtpException extends RuntimeException {
	public InvalidOtpException(String email) {
		super("Invalid OTP provided for " + email);
	}
}
