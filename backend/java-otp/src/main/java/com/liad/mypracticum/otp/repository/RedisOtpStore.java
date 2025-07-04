package com.liad.mypracticum.otp.repository;

import java.time.Duration;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OtpRepository {

	private final StringRedisTemplate redis;

	public OtpRepository(StringRedisTemplate redis) {
		this.redis = redis;
	}

	private String key(String userId) {
		return "otp:" + userId;
	}

	/**
	 * Store an OTP code for a user with a TTL.
	 */
	public void save(String userId, String code, Duration ttl) {
		redis.opsForValue().set(key(userId), code, ttl);
	}

	/**
	 * Retrieve the OTP code if it hasn’t expired.
	 */
	public Optional<String> find(String userId) {
		String code = redis.opsForValue().get(key(userId));
		return Optional.ofNullable(code);
	}

	/**
	 * Delete the OTP (e.g. after successful verification).
	 */
	public void delete(String userId) {
		redis.delete(key(userId));
	}
}
