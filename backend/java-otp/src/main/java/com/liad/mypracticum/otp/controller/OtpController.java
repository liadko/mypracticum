package com.liad.mypracticum.otp.controller;

import com.liad.mypracticum.otp.client.OtpMailClient;
import com.liad.mypracticum.otp.dto.SendOtpRequest;
import com.liad.mypracticum.otp.dto.VerifyOtpRequest;
import com.liad.mypracticum.otp.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
public class OtpController {

	private final OtpService otpService;

	public OtpController(OtpService otpService) {
		this.otpService = otpService;
	}

	@PostMapping("/v1/otp")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void sendOtp(@RequestBody @Valid SendOtpRequest req) {
		otpService.generateAndSend(req.email(), Duration.ofMinutes(5));
	}

	@PostMapping("/v1/verify")
	public void verify(@RequestBody @Valid VerifyOtpRequest req) {
		otpService.verifyOrThrow(req.email(), req.code());
	}
}
