package com.liad.mypracticum.otp.service;

import java.time.Duration;
import java.util.Optional;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.liad.mypracticum.otp.repository.OtpStore;

@Service
public class OtpService {

	private final OtpStore store;
	private final Random random = new Random();

	public OtpService(OtpStore store) {
		this.store = store;
	}

	public String generateAndSend(String userId, Duration ttl) {
		String code = String.format("%06d", random.nextInt(1_000_000));
		store.save(userId, code, ttl);
		return code;
	}

	public boolean verify(String userId, String code) {
		// 1) Try to fetch the stored code
		Optional<String> maybeStored = store.find(userId);

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
		store.delete(userId);
		return true;
	}
}
