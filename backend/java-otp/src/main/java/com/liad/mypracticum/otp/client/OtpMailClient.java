package com.liad.mypracticum.otp.client;

public interface OtpMailClient {
	void send(String email, String code);
}
