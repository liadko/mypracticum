package service

import (
	"context"

	"mypracticum/backend/pkg/jwt"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

// TokenService orchestrates both OTP‐based login and JWT validation.
type TokenService struct {
	jwtMgr   *jwt.Manager
	userRepo repository.UserRepo
}

// NewTokenService wires up dependencies.
func NewTokenService(
	jwtMgr *jwt.Manager,
	userRepo repository.UserRepo,
) *TokenService {
	return &TokenService{
		jwtMgr:   jwtMgr,
		userRepo: userRepo,
	}
}

// Generates a JWT using the user's ID
func (s *TokenService) GenerateToken(ctx context.Context, userID uuid.UUID) (string, error) {
	token, err := s.jwtMgr.Generate(userID)
	if err != nil {
		return "", TokenGenerationError{err}
	}
	return token, nil
}

// ValidateToken parses and verifies the JWT, then returns the embedded userID.
func (s *TokenService) ValidateToken(tokenStr string) (uuid.UUID, error) {
	claims, err := s.jwtMgr.Parse(tokenStr)
	if err != nil {
		return uuid.Nil, TokenValidationError{Err: err}
	}

	return claims.UserID, nil
}
