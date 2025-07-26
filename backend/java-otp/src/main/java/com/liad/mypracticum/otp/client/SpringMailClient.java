package com.liad.mypracticum.otp.client;

import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Profile("smtp")
public class SpringMailClient implements OtpMailClient {

	private final JavaMailSender javaMailSender;

	public SpringMailClient(JavaMailSender javaMailSender) {
		this.javaMailSender = javaMailSender;
	}

	@Override
	public void send(String email, String code) {
		var msg = new SimpleMailMessage();
		msg.setTo(email);
		msg.setFrom("liadkoren@gmail.com");
		msg.setSubject("Your One Time Password");
		msg.setText("here's your code i guess: " + code + " ¯\\_(ツ)_/¯");
		javaMailSender.send(msg);
	}
}
