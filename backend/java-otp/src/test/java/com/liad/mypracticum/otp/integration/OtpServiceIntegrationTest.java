package com.liad.mypracticum.otp.integration;


import com.liad.mypracticum.otp.client.OtpMailClient;
import com.liad.mypracticum.otp.repository.OtpStore;
import com.liad.mypracticum.otp.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")   // pick up a test application-test.properties if you like
public class OtpServiceIntegrationTest {
	// ① real service, backed by real store bean
	@Autowired
	private OtpService service;

	// ② real store bean (RedisOtpStore)
	@Autowired
	private OtpStore store;

	// ③ access to Redis so we can inspect keys
	@Autowired
	private StringRedisTemplate redisTemplate;

	// ④ replace the real mail client bean with a Mockito mock
	@MockitoBean
	private OtpMailClient mailClient;

	@BeforeEach
	void cleanRedis() {
		// ensure a fresh Redis instance for each test
		redisTemplate.getConnectionFactory()
				.getConnection()
				.flushDb();
	}

	@Test
	void contextLoads() {
		// sanity check that beans are injected
		assertNotNull(service);
		assertNotNull(store);
		assertNotNull(redisTemplate);
		assertNotNull(mailClient);
	}
}
