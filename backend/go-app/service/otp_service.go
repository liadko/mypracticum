package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/otp"    // Notifier interface
	"mypracticum/backend/repository" // UserRepo + OTPRepo + ErrNotFound

	"github.com/google/uuid"
)

// OTPService orchestrates user lookup, OTP generation, persistence and notification.
type OTPService struct {
	userRepo   repository.UserRepo
	otpRepo    repository.OTPRepo
	notifier   otp.Notifier
	codeExpire time.Duration
}

// NewOTPService wires in your repositories and notifier (email/SMS client).
func NewOTPService(u repository.UserRepo, o repository.OTPRepo, n otp.Notifier) *OTPService {
	return &OTPService{
		userRepo:   u,
		otpRepo:    o,
		notifier:   n,
		codeExpire: 5 * time.Minute,
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

	// 2) generate code + expiry
	otpEnt, err := domain.NewOTP(user.ID, s.codeExpire)
	if err != nil {
		return fmt.Errorf("generate OTP: %w", err)
	}

	// 3) persist
	if err := s.otpRepo.Save(ctx, otpEnt); err != nil {
		return fmt.Errorf("save OTP: %w", err)
	}

	// 4) send (email/SMS)
	if err := s.notifier.Send(ctx, email, otpEnt.Code); err != nil {
		// cleanup so no orphaned code
		if delErr := s.otpRepo.Delete(ctx, user.ID, otpEnt.Code); delErr != nil {
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

	// 2) fetch stored OTP (missing code → validation failure)
	stored, err := s.otpRepo.Get(ctx, user.ID, code)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return uuid.Nil, domain.ValidationError("invalid credentials")
		}
		return uuid.Nil, fmt.Errorf("fetch OTP: %w", err)
	}

	// 3) check expiry or mismatch (expired or wrong → validation failure)
	if err := stored.Validate(code); err != nil {
		return uuid.Nil, domain.ValidationError("invalid credentials")
	}

	// 4) consume it (DB error → service failure)
	if err := s.otpRepo.Delete(ctx, user.ID, code); err != nil {
		return uuid.Nil, fmt.Errorf("consume OTP: %w", err)
	}

	return user.ID, nil
}
