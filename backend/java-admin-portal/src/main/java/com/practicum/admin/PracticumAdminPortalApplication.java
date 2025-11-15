package com.practicum.admin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.event.EventListener;

import java.awt.*;
import java.net.URI;

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



    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Practicum Admin Portal is ready to accept requests... Launching browser.");

        String appUrl = "http://localhost:8090";

        if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            try {
                Desktop.getDesktop().browse(new URI(appUrl));
            } catch (Exception e) {
                log.warn("Failed to launch browser: {}", e.getMessage());
                log.warn("Please open this URL in your browser: {}", appUrl);
            }
        } else {
            log.warn("Could not auto-launch browser.");
            log.warn("Please open this URL in your browser: {}", appUrl);
        }
    }
}
