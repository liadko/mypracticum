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

	private String key(String userId) {
		return "otp:" + userId;
	}

	/**
	 * Store an OTP code for a user with a TTL.
	 */
	@Override
	public void save(String userId, String code, Duration ttl) {
		redis.opsForValue().set(key(userId), code, ttl);
	}

	/**
	 * Retrieve the OTP code if it hasn’t expired.
	 */
	@Override
	public Optional<String> find(String userId) {
		String code = redis.opsForValue().get(key(userId));
		return Optional.ofNullable(code);
	}

	/**
	 * Delete the OTP (e.g. after successful verification).
	 */
	@Override
	public void delete(String userId) {
		redis.delete(key(userId));
	}
}
