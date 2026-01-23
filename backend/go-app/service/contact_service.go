package service

import (
	"context"
	"errors"
	"log"
	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/notifier"
	"mypracticum/backend/repository"
	"strings"

	"github.com/google/uuid"
)

type ContactService struct {
	repo     repository.ContactRepo
	userSvc  *UserService
	notifier notifier.Notifier
}

func NewContactService(repo repository.ContactRepo, userSvc *UserService, notifier notifier.Notifier) *ContactService {
	return &ContactService{repo: repo, userSvc: userSvc, notifier: notifier}
}

func (s *ContactService) AddContact(ctx context.Context, userID uuid.UUID, newContact domain.NewContact) (domain.Contact, error) {
	log.Printf("[ContactService.AddContact] Adding contact for user %s, type: %s, name: %s", userID, newContact.Type, newContact.Name)
	user, err := s.userSvc.GetUserByID(ctx, userID)
	if err != nil {
		log.Printf("[ContactService.AddContact] Failed to get user: %v", err)
		return domain.Contact{}, DBError{err}
	}

	if newContact.Type == domain.MentorContact {
		log.Printf("[ContactService.AddContact] Processing mentor contact with email: %v", newContact.Email)
		if err := s.handleMentorContact(ctx, userID, user.Email, nil, &newContact); err != nil {
			log.Printf("[ContactService.AddContact] Failed to handle mentor contact: %v", err)
			return domain.Contact{}, err
		}
	}

	contact, err := domain.NewContactFrom(userID, newContact)
	if err != nil {
		log.Printf("[ContactService.AddContact] Failed to create contact from domain: %v", err)
		return domain.Contact{}, err
	}

	log.Printf("[ContactService.AddContact] Creating contact in repository for user %s", userID)
	return s.repo.Create(ctx, userID, contact)
}

func (s *ContactService) UpdateContact(
	ctx context.Context,
	userID, contactID uuid.UUID,
	newContact domain.NewContact,
) (domain.Contact, error) {
	log.Printf("[ContactService.UpdateContact] Updating contact %s for user %s, type: %s", contactID, userID, newContact.Type)
	user, err := s.userSvc.GetUserByID(ctx, userID)
	if err != nil {
		log.Printf("[ContactService.UpdateContact] Failed to get user: %v", err)
		return domain.Contact{}, DBError{err}
	}

	if newContact.Type == domain.MentorContact {
		log.Printf("[ContactService.UpdateContact] Processing mentor contact update with email: %v", newContact.Email)
		if err := s.handleMentorContact(ctx, userID, user.Email, &contactID, &newContact); err != nil {
			log.Printf("[ContactService.UpdateContact] Failed to handle mentor contact: %v", err)
			return domain.Contact{}, err
		}
	} else {
		newContact.MentorUserID = nil // clear if not a mentor
	}

	contact, err := domain.UpdatedContact(userID, contactID, newContact)
	if err != nil {
		log.Printf("[ContactService.UpdateContact] Failed to create updated contact: %v", err)
		return domain.Contact{}, err
	}

	log.Printf("[ContactService.UpdateContact] Updating contact in repository for contact %s", contactID)
	updated, err := s.repo.Update(ctx, userID, contactID, contact)
	if errors.Is(err, repository.ErrNotFound) {
		log.Printf("[ContactService.UpdateContact] Contact not found: %s", contactID)
		return domain.Contact{}, NotFoundError{"contact", contactID.String()}
	}
	if err != nil {
		log.Printf("[ContactService.UpdateContact] Failed to update contact: %v", err)
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
	log.Printf("[ContactService.handleMentorContact] Handling mentor contact for user %s", userID)
	if newContact.Email == nil {
		log.Printf("[ContactService.handleMentorContact] Validation error: mentor must have email")
		return ValidationError("mentor must have email")
	}

	// Email must not equal the user's own email
	if userEmail == *newContact.Email {
		log.Printf("[ContactService.handleMentorContact] Validation error: mentor email %s matches user's own email", *newContact.Email)
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

	log.Printf("[ContactService.handleMentorContact] Checking if mentor email %s already exists for user %s", *newContact.Email, userID)
	exists, err := s.repo.UserHasMentorExcept(ctx, userID, *newContact.Email, excludedUUID)
	if err != nil {
		log.Printf("[ContactService.handleMentorContact] Failed to check mentor existence: %v", err)
		return DBError{Err: err}
	}
	if exists {
		log.Printf("[ContactService.handleMentorContact] Mentor with email %s already exists for user %s", *newContact.Email, userID)
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
		log.Printf("[ContactService.handleMentorContact] Ensuring mentor user exists: email: %s, name: %s %s", email, first, last)
		mentorUserID, err := s.userSvc.EnsureUserIDByEmailWithRole(ctx, email, "mentor", first, last, userID)
		if err != nil {
			log.Printf("[ContactService.handleMentorContact] Failed to ensure mentor user: %v", err)
			return err
		}
		log.Printf("[ContactService.handleMentorContact] Linked mentor user %s", mentorUserID)
		newContact.MentorUserID = &mentorUserID
	}

	return nil
}

func (s *ContactService) ListStudentContacts(ctx context.Context, userID uuid.UUID) ([]domain.Contact, error) {
	log.Printf("[ContactService.ListStudentContacts] Listing contacts for user %s", userID)
	contacts, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		log.Printf("[ContactService.ListStudentContacts] Failed to list contacts: %v", err)
		return nil, err
	}
	log.Printf("[ContactService.ListStudentContacts] Retrieved %d contacts for user %s", len(contacts), userID)
	return contacts, nil
}

func (s *ContactService) ListMentorStudentsAsContacts(ctx context.Context, mentorUserID uuid.UUID) ([]domain.Contact, error) {
	log.Printf("[ContactService.ListMentorStudentsAsContacts] Listing students for mentor %s", mentorUserID)
	us, err := s.userSvc.ListStudentsForMentor(ctx, mentorUserID)
	if err != nil {
		log.Printf("[ContactService.ListMentorStudentsAsContacts] Failed to list students: %v", err)
		return nil, err
	}
	contacts := domain.MapUsersToStudentContactViews(us)
	log.Printf("[ContactService.ListMentorStudentsAsContacts] Retrieved %d students for mentor %s", len(contacts), mentorUserID)
	return contacts, nil
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

func (s *ContactService) InviteMentor(ctx context.Context, userID uuid.UUID, contactID uuid.UUID) error {
	log.Printf("[ContactService.InviteMentor] Inviting mentor from contact %s for user %s", contactID, userID)

	// fetch contact
	mentor, err := s.repo.GetMentor(ctx, userID, contactID)
	if errors.Is(err, repository.ErrNotFound) {
		log.Printf("[ContactService.InviteMentor] Contact not found, or found but isn't mentor: %s", contactID)
		return NotFoundError{"contact", contactID.String()}
	}
	if err != nil {
		log.Printf("[ContactService.InviteMentor] Failed to fetch contact: %v", err)
		return DBError{Err: err}
	}

	if mentor.MentorUserID == nil {
		log.Printf("[ContactService.InviteMentor] Contact %s is not linked to a mentor user", contactID)
		return ValidationError("mentor contact is not linked to a mentor user")
	}

	log.Printf("[ContactService.InviteMentor] Fetching mentor user %s", *mentor.MentorUserID)
	// get mentor user to obtain email / name
	mentorUser, err := s.userSvc.GetUserByID(ctx, *mentor.MentorUserID)
	if err != nil {
		log.Printf("[ContactService.InviteMentor] Failed to get mentor user: %v", err)
		return DBError{Err: err}
	}

	log.Printf("[ContactService.InviteMentor] Sending invite to mentor %s with email %s", mentorUser.ID, mentorUser.Email)
	// send invite
	if err := s.notifier.SendInvite(ctx, mentorUser.Email, mentorUser.FirstName); err != nil {
		log.Printf("[ContactService.InviteMentor] Failed to send invite: %v", err)
		return DBError{Err: err}
	}

	log.Printf("[ContactService.InviteMentor] Successfully sent invite to mentor %s", mentorUser.Email)
	return nil
}
