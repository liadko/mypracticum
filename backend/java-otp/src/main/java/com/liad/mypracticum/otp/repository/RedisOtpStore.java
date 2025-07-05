package com.liad.mypracticum.otp.repository;

import java.time.Duration;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RedisOtpStore implements OtpStore {

	private final StringRedisTemplate redis;

	public RedisOtpStore(StringRedisTemplate redis) {
		this.redis = redis;
	}

	private String key(String email) {
		return "otp:" + email;
	}

	/**
	 * Store an OTP code for a user with a TTL.
	 */
	@Override
	public void save(String email, String code, Duration ttl) {
		redis.opsForValue().set(key(email), code, ttl);
	}

	/**
	 * Retrieve the OTP code if it hasn’t expired.
	 */
	@Override
	public Optional<String> find(String email) {
		String code = redis.opsForValue().get(key(email));
		return Optional.ofNullable(code);
	}

	/**
	 * Delete the OTP (e.g. after successful verification).
	 */
	@Override
	public void delete(String email) {
		redis.delete(key(email));
	}
}
