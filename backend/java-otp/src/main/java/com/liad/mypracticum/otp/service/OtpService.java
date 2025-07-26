package com.liad.mypracticum.otp.service;

import java.time.Duration;
import java.util.Random;

import com.liad.mypracticum.otp.client.OtpMailClient;
import com.liad.mypracticum.otp.exception.InvalidOtpException;
import com.liad.mypracticum.otp.exception.OtpSendException;
import com.liad.mypracticum.otp.exception.OtpStorageException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;

import com.liad.mypracticum.otp.repository.OtpStore;

@Service
public class OtpService {

	private static final Logger log = LoggerFactory.getLogger(OtpService.class);

	private final OtpMailClient otpMailClient;

	private final OtpStore store;
	private final Random random = new Random();

	public OtpService(OtpMailClient otpMailClient, OtpStore store) {
		this.otpMailClient = otpMailClient;
		this.store = store;
	}

	public void generateAndSend(String email, Duration ttl) {

		String code = String.format("%06d", random.nextInt(100_000, 1_000_000));

		try {
			store.save(email, code, ttl);
		} catch (org.springframework.dao.DataAccessException ex) {
			log.error("Redis save failed for user {}: {}", email, ex.getMessage(), ex);
			throw new OtpStorageException(email, ex);
		}

		try {
			otpMailClient.send(email, code);
		} catch (org.springframework.mail.MailException ex) {
			throw new OtpSendException(email, ex);
		}
	}

	public void verifyOrThrow(String email, String code) {
		// 1) Try to fetch the stored code
		String stored = store.find(email).orElseThrow(() -> new InvalidOtpException(email));

		// 2) If it doesn’t match, fail
		if (!stored.equals(code)) {
			throw new InvalidOtpException(email);
		}

		// 3) On success, delete
		store.delete(email);
	}
}
