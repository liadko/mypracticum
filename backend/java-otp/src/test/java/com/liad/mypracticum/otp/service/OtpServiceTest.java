package com.liad.mypracticum.otp.service;

import com.liad.mypracticum.otp.client.OtpMailClient;
import com.liad.mypracticum.otp.exception.OtpSendException;
import com.liad.mypracticum.otp.exception.OtpStorageException;
import com.liad.mypracticum.otp.repository.OtpStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

	private OtpService service;

	private final OtpStore store = mock(OtpStore.class);
	private final OtpMailClient mailClient = mock(OtpMailClient.class);

	@BeforeEach
	void setUp() {
		service = new OtpService(mailClient, store);
	}

	@Test
	void generateAndSend_happyPath_savesAndSends() {
		// Arrange
		String email = "user@example.com";
		Duration ttl = Duration.ofMinutes(5);

		// Act
		service.generateAndSend(email, ttl);

		// Assert: store.save was called with the same email, a 6-digit code, and correct TTL
		// 1) Capture the generated code passed to store.save(...)
		ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
		verify(store).save(eq(email),          // exact match on email
				codeCaptor.capture(),// grab whatever 2nd arg was
				eq(ttl)             // exact match on ttl
		);

		// 2) Inspect the captured code
		String generatedCode = codeCaptor.getValue();
		assertNotNull(generatedCode);
		assertTrue(generatedCode.matches("\\d{6}")); // six digits

		// 3) Verify mailClient.send(...) was called with that same code
		verify(mailClient).send(email, generatedCode);

		verifyNoMoreInteractions(store, mailClient);
	}


	@Test
	void generateAndSend_whenStoreSaveFails_throwsOtpStorageException() {
		// Arrange
		String email = "user@example.com";
		Duration ttl   = Duration.ofMinutes(5);
		// stub store.save(...) to throw
		doThrow(new org.springframework.dao.DataAccessException("redis down"){})
				.when(store).save(eq(email), anyString(), eq(ttl));

		// Act & Assert
		OtpStorageException ex = assertThrows(
				OtpStorageException.class,
				() -> service.generateAndSend(email, ttl)
		);
		// optional: check that the exception mentions the email
		assertTrue(ex.getMessage().contains(email));

		// Verify we never called mailClient.send
		verifyNoInteractions(mailClient);
	}

	@Test
	void generateAndSend_whenMailSendFails_throwsOtpSendException() {
		// Arrange
		String email = "user@example.com";
		Duration ttl   = Duration.ofMinutes(5);
		// stub mailClient.send(...) to throw
		doThrow(new org.springframework.mail.MailException("smtp down"){})
				.when(mailClient).send(eq(email), anyString());

		// Act & Assert
		OtpSendException ex = assertThrows(
				OtpSendException.class,
				() -> service.generateAndSend(email, ttl)
		);
		assertTrue(ex.getMessage().contains(email));

		// Verify we still called store.save exactly once
		verify(store).save(eq(email), anyString(), eq(ttl));
		// And no extra calls on mailClient beyond the one that threw
		verify(mailClient).send(eq(email), anyString());
	}
}