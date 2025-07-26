package com.liad.mypracticum.otp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.web.reactive.function.client.WebClient;

public class SmooveWebClientConfig {

	@Value("${smoove.api.token}")
	private String apiToken;

	@Value("${smoove.api.base_url}")
	private String apiUrl;


	@Bean
	WebClient smooveWebClient(WebClient.Builder builder) {
		return builder
				.baseUrl(apiUrl)
				.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiToken)
				.build();
	}
}

/*
POST to
https://rest.smoove.io/v1/Campaigns?sendNow=true&templateName=my-practicum-otp

with request body:
{
  "customData": [
    { "key": "%OTP_CODE%", "value": "123456" }
  ],
  "toMembersById": [831266604],
  "toMembersByEmail": ["funky8oy@gmail.com"]
}


 */