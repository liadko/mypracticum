package com.liad.mypracticum.otp.repository;

import java.time.Duration;
import java.util.Optional;

public interface OtpStore {
	void save(String userId, String code, Duration ttl);
	Optional<String> find(String userId);
	void delete(String userId);
}
