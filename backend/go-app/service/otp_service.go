package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

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
	OTPExpire   time.Duration
}

// NewOTPService wires in your repositories and notifier (email/SMS client).
func NewOTPService(u repository.UserRepo, s cache.Store, n otp.Notifier, l cache.Limiter, e time.Duration) *OTPService {
	return &OTPService{
		userRepo:    u,
		otpStore:    s,
		notifier:    n,
		sendLimiter: l,
		OTPExpire:   e,
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
	otpEnt, err := domain.NewOTP(user.ID)
	if err != nil {
		return fmt.Errorf("generate OTP: %w", err)
	}

	// 3) persist in cache with TTL
	otpKey := fmt.Sprintf("otp:%s:%s", user.ID, otpEnt.Code)
	if err := s.otpStore.Set(otpKey, []byte(otpEnt.Code), s.OTPExpire); err != nil {
		return fmt.Errorf("cache.Set OTP: %w", err)
	}

	log.Printf("SHHHHH.... %s", otpEnt.Code)

	// 4) send (email/SMS)
	if err := s.notifier.Send(ctx, email, otpEnt.Code); err != nil {
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
