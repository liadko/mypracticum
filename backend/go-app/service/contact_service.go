package service

import (
	"context"
	"errors"
	"mypracticum/backend/domain"
	"mypracticum/backend/repository"
	"strings"

	"github.com/google/uuid"
)

type ContactService struct {
	repo    repository.ContactRepo
	userSvc *UserService
}

func NewContactService(repo repository.ContactRepo, userSvc *UserService) *ContactService {
	return &ContactService{repo: repo, userSvc: userSvc}
}

func (s *ContactService) AddContact(ctx context.Context, userID uuid.UUID, newContact domain.NewContact) (domain.Contact, error) {
	// User can't have 2 contacts of the same type with the same email
	if newContact.Email != nil {
		exists, err := s.repo.ExistsByUserTypeEmail(ctx, userID, newContact.Type, *newContact.Email)
		if err != nil {
			return domain.Contact{}, DBError{Err: err}
		}
		if exists {
			return domain.Contact{}, AlreadyExistsError{
				Resource: "contact",
				Field:    "email",
				Value:    *newContact.Email,
			}
		}
	}

	// If this is a mentor, ensure a user exists and attach its UUID
	if newContact.Type == domain.MentorContact && newContact.Email != nil {
		email := strings.TrimSpace(*newContact.Email)
		if email != "" {
			first, last := splitName(newContact.Name)
			mentorUserID, err := s.userSvc.EnsureUserIDByEmailWithRole(ctx, email, "mentor", first, last, userID)
			if err != nil {
				return domain.Contact{}, err
			}
			newContact.MentorUserID = &mentorUserID
		}
	}

	contact, err := domain.NewContactFrom(userID, newContact)
	if err != nil {
		return domain.Contact{}, err
	}

	return s.repo.Create(ctx, userID, contact)
}

// small local helper; keeps handler clean
func splitName(full string) (string, string) {
	full = strings.TrimSpace(full)
	if full == "" {
		return "", ""
	}
	parts := strings.Fields(full)
	if len(parts) == 1 {
		return parts[0], ""
	}
	n := len(parts)
	return strings.Join(parts[:n-1], " "), parts[n-1]
}

func (s *ContactService) UpdateContact(ctx context.Context, userID, contactID uuid.UUID, newContact domain.NewContact) (domain.Contact, error) {
	// build & validate in one shot
	contact, err := domain.UpdatedContact(userID, contactID, newContact)
	if err != nil {
		return domain.Contact{}, err
	}

	updated, err := s.repo.Update(ctx, userID, contactID, contact)
	if errors.Is(err, repository.ErrNotFound) {
		return domain.Contact{}, NotFoundError{"contact", contactID.String()}
	}
	if err != nil {
		return domain.Contact{}, DBError{Err: err}
	}
	return updated, nil

}

// func (s *ContactService) RemoveContact(ctx context.Context, userID, contactID string) error {
// 	return s.repo.Delete(ctx, userID, userID)
// }

func (s *ContactService) ListStudentContacts(ctx context.Context, userID uuid.UUID) ([]domain.Contact, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *ContactService) ListMentorStudentsAsContacts(ctx context.Context, mentorUserID uuid.UUID) ([]domain.Contact, error) {
	us, err := s.userSvc.ListStudentsForMentor(ctx, mentorUserID)
	if err != nil {
		return nil, err
	}
	return domain.MapUsersToStudentContactViews(us), nil
}
