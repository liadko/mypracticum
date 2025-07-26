package com.liad.mypracticum.otp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RedisConfig {

	@Value("${redis.host:localhost}")
	private String redisHost;


	@Value("${redis.port:6379}")
	private int redisPort;

	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		return new LettuceConnectionFactory(redisHost, redisPort);
	}

	@Bean
	public StringRedisTemplate redisTemplate(LettuceConnectionFactory cf) {
		return new StringRedisTemplate(cf);
	}
}