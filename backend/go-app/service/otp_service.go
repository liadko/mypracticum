package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"time"

	"mypracticum/backend/config"
	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/cache"
	"mypracticum/backend/pkg/otp"    // Notifier interface
	"mypracticum/backend/repository" // UserRepo + OTPRepo + ErrNotFound

	"github.com/google/uuid"
)

// OTPService orchestrates user lookup, OTP generation, persistence and notification.
type OTPService struct {
	userRepo    repository.UserRepo
	otpStore    cache.Store
	sendLimiter cache.Limiter
	notifier    otp.Notifier

	codeLength int
	expire     time.Duration
}

// NewOTPService wires in your repositories and notifier (email/SMS client).
func NewOTPService(u repository.UserRepo, s cache.Store, n otp.Notifier, l cache.Limiter, cfg config.OTPConfig) *OTPService {
	return &OTPService{
		userRepo:    u,
		otpStore:    s,
		notifier:    n,
		sendLimiter: l,
		codeLength:  cfg.CodeLength,
		expire:      cfg.Expiry,
	}
}

// SendOTP looks up a user by email, generates a one-time code with expiry,
// persists it, and notifies the user via the configured Notifier.
//
// Errors:
//
//	– NotFoundError if there’s no user with the given email.
//	– MiscError  for any database or notification failures.
func (s *OTPService) SendOTP(ctx context.Context, email string) error {
	// 1) find user
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return NotFoundError{"user", email}
		}
		return fmt.Errorf("lookup user: %w", err)
	}

	// before generatinga new code, check limiter
	limitKey := fmt.Sprintf("rl:otpSend:%s", email)
	ok, err := s.sendLimiter.Allow(limitKey)
	if err != nil {
		return fmt.Errorf("rate-limiter failed: %w", err)
	}
	if !ok {
		return TooManyRequestsError{"please wait before resending"}
	}

	// 2) generate code
	code, err := generateCode(s.codeLength)
	if err != nil {
		return fmt.Errorf("otp code generation failed: %w", err)
	}

	// 3) persist in cache with TTL
	otpKey := fmt.Sprintf("otp:%s:%s", user.ID, code)
	if err := s.otpStore.Set(otpKey, []byte(code), s.expire); err != nil {
		return fmt.Errorf("cache.Set OTP: %w", err)
	}

	log.Printf("SHHHHH.... %s", code)

	// 4) send (email/SMS)
	if err := s.notifier.Send(ctx, email, code); err != nil {
		// cleanup so no orphaned code
		if delErr := s.otpStore.Delete(otpKey); delErr != nil {
			log.Printf("cleanup OTP failed: %v", delErr)
		}
		return fmt.Errorf("notify OTP: %w", err)
	}

	return nil
}

// VerifyOTP checks the one-time code for a given email, consumes it on success,
// and returns the corresponding userID.
//
// Errors:
//
//	– ValidationError if the email is unknown, or the code is incorrect or expired.
//	– MiscError    for any database or other unexpected failure.
func (s *OTPService) VerifyOTP(
	ctx context.Context,
	email, code string,
) (uuid.UUID, error) {
	// 1) find user (unknown email → validation failure)
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return uuid.Nil, domain.ValidationError("invalid credentials")
		}
		return uuid.Nil, fmt.Errorf("lookup user: %w", err)
	}

	// 2) fetch from cache (will only exist if unexpired)
	key := fmt.Sprintf("otp:%s:%s", user.ID, code)
	_, err = s.otpStore.Get(key)
	if err != nil {
		return uuid.Nil, domain.ValidationError("invalid credentials")
	}

	// 3) consume it (DB error → service failure)
	if err := s.otpStore.Delete(key); err != nil {
		return uuid.Nil, fmt.Errorf("consume OTP: %w", err)
	}

	return user.ID, nil
}

// generateCode generates a {length}-digit code
func generateCode(length int) (string, error) {
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate code: %w", err)
	}
	code := ""
	for _, b := range buf {
		code += fmt.Sprint(int(b) % 10)
	}

	return code, nil
}
