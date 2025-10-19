package com.practicum.admin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@Slf4j
public class PracticumAdminPortalApplication implements CommandLineRunner {

	public static void main(String[] args) {
		SpringApplication.run(PracticumAdminPortalApplication.class, args);
	}

	@Value("${practicum.api.base-url}")
	private String apiUrl;

	@Override
	public void run(String... args) {
		log.info("Admin Portal started. Connecting to Practicum API at: {}", apiUrl);
	}
}
