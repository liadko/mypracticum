package com.practicum.admin.config;

import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class FeignClientConfig {

	// Inject the value from your properties file
	@Value("${practicum.api.jwt}")
	private String practicumApiJwt;

	@Bean
	public RequestInterceptor apiKeyInterceptor() {
		log.debug("Attaching practicum API key header to Feign request.");
		return requestTemplate -> {
			// Add the static header to the outgoing Feign request
			requestTemplate.header("Authorization", "Bearer " + practicumApiJwt);
		};
	}
}