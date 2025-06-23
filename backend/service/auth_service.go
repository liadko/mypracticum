package service

import (
	"context"
	"mypracticum/backend/repository"
)

type AuthService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (a *AuthService) ResolveUserID(ctx context.Context, studentID string) (string, error) {
	return a.userRepo.GetByStudentID(ctx, studentID)
}
