package service

import (
	"context"

	"mypracticum/backend/pkg/jwt"
	"mypracticum/backend/repository"
)

// TokenService orchestrates both OTP‐based login and JWT validation.
type TokenService struct {
	jwtMgr   *jwt.Manager
	userRepo repository.UserRepository
}

// NewTokenService wires up dependencies.
func NewTokenService(
	jwtMgr *jwt.Manager,
	userRepo repository.UserRepository,
) *TokenService {
	return &TokenService{
		jwtMgr:   jwtMgr,
		userRepo: userRepo,
	}
}

// Generates a JWT using the user's ID
func (s *TokenService) GenerateToken(ctx context.Context, userID string) (string, error) {
	token, err := s.jwtMgr.Generate(userID)
	if err != nil {
		return "", TokenGenerationError{err}
	}
	return token, nil
}

// ValidateToken parses and verifies the JWT, then returns the embedded userID.
func (s *TokenService) ValidateToken(tokenStr string) (string, error) {
	claims, err := s.jwtMgr.Parse(tokenStr)
	if err != nil {
		return "", TokenValidationError{Err: err}
	}
	return claims.UserID, nil
}
