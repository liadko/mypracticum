package com.liad.mypracticum.otp.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;


@Component
@Profile("smoove")
public class SmooveMailClient implements OtpMailClient {


	private final WebClient smooveClient;

	public SmooveMailClient(WebClient smooveClient) {
		this.smooveClient = smooveClient;
	}


	@Override
	public void send(String email, String code) {
//		var msg = new SimpleMailMessage();
//		msg.setTo(email);
//		msg.setFrom("liadkoren@gmail.com");
//		msg.setSubject("Your One Time Password");
//		msg.setText("here's your code i guess: " + code + " ¯\\_(ツ)_/¯");
//		javaMailSender.send(msg);
	}
}
