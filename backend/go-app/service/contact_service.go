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
	user, err := s.userSvc.GetUserByID(ctx, userID)
	if err != nil {
		return domain.Contact{}, DBError{err}
	}

	if newContact.Type == domain.MentorContact {
		if err := s.handleMentorContact(ctx, userID, user.Email, nil, &newContact); err != nil {
			return domain.Contact{}, err
		}
	}

	contact, err := domain.NewContactFrom(userID, newContact)
	if err != nil {
		return domain.Contact{}, err
	}

	return s.repo.Create(ctx, userID, contact)
}

func (s *ContactService) UpdateContact(
	ctx context.Context,
	userID, contactID uuid.UUID,
	newContact domain.NewContact,
) (domain.Contact, error) {
	user, err := s.userSvc.GetUserByID(ctx, userID)
	if err != nil {
		return domain.Contact{}, DBError{err}
	}

	if newContact.Type == domain.MentorContact {
		if err := s.handleMentorContact(ctx, userID, user.Email, &contactID, &newContact); err != nil {
			return domain.Contact{}, err
		}
	} else {
		newContact.MentorUserID = nil // clear if not a mentor
	}

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

func (s *ContactService) handleMentorContact(
	ctx context.Context,
	userID uuid.UUID,
	userEmail string,
	existingContactID *uuid.UUID, // nil for Add, non-nil for Update
	newContact *domain.NewContact,
) error {
	if newContact.Email == nil || newContact.MentorshipType == nil {
		return ValidationError("mentor must have both email and mentorshipType")
	}

	// Email must not equal the user's own email
	if userEmail == *newContact.Email {
		return AlreadyExistsError{
			Resource: "contact",
			Field:    "email",
			Value:    *newContact.Email,
		}
	}

	// Uniqueness check

	var excludedUUID uuid.UUID
	if existingContactID != nil {
		excludedUUID = *existingContactID
	} else {
		excludedUUID = uuid.Nil
	}

	exists, err := s.repo.UserHasMentorExcept(ctx, userID, *newContact.Email, *newContact.MentorshipType, excludedUUID)
	if err != nil {
		return DBError{Err: err}
	}
	if exists {
		return AlreadyExistsError{
			Resource: "contact",
			Field:    "email",
			Value:    *newContact.Email,
		}
	}

	// Ensure linked mentor user exists
	email := strings.TrimSpace(*newContact.Email)
	if email != "" {
		first, last := splitName(newContact.Name)
		mentorUserID, err := s.userSvc.EnsureUserIDByEmailWithRole(ctx, email, "mentor", first, last, userID)
		if err != nil {
			return err
		}
		newContact.MentorUserID = &mentorUserID
	}

	return nil
}

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
