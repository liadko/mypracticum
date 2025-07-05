package com.liad.mypracticum.otp.service;

import java.time.Duration;
import java.util.Optional;
import java.util.Random;

import com.liad.mypracticum.otp.client.OtpMailClient;
import org.springframework.stereotype.Service;

import com.liad.mypracticum.otp.repository.OtpStore;

@Service
public class OtpService {

	private final OtpMailClient otpMailClient;

	private final OtpStore store;
	private final Random random = new Random();

	public OtpService(OtpMailClient otpMailClient, OtpStore store) {
		this.otpMailClient = otpMailClient;
		this.store = store;
	}

	public void generateAndSend(String email, Duration ttl) {
		String code = String.format("%06d", random.nextInt(100_000,1_000_000));
		store.save(email, code, ttl);

		otpMailClient.send(email, code);
	}

	public boolean verify(String email, String code) {
		// 1) Try to fetch the stored code
		Optional<String> maybeStored = store.find(email);

		// 2) If missing or expired, fail
		if (maybeStored.isEmpty()) {
			return false;
		}

		String stored = maybeStored.get();

		// 3) If it doesn’t match, fail
		if (!stored.equals(code)) {
			return false;
		}

		// 4) On success, delete and return true
		store.delete(email);
		return true;
	}
}
