package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

// StudentFrozenError means the action is not allowed while the student is
// frozen. Msg is shown to the end user as-is.
type StudentFrozenError struct{ Msg string }

func (e StudentFrozenError) Error() string { return e.Msg }

const (
	frozenStudentMessage = "החשבון אינו פעיל, ולכן לא ניתן לבצע שינויים. ניתן לצפות בנתונים בלבד."
	frozenMentorMessage  = "חשבון הסטודנט/ית אינו פעיל, ולכן לא ניתן לאשר או לבטל אישור של שעות."
)

// StudentStatusRequest changes the status of many students at once. Each
// identifier may be a user ID, an email or a TAZ.
type StudentStatusRequest struct {
	Identifiers []string
	Status      domain.StudentStatus
	Reason      domain.FreezeReason
	Note        string
}

// StudentStatusResult reports what happened to each identifier.
type StudentStatusResult struct {
	Total    int      `json:"total"`
	Updated  int      `json:"updated"`
	NotFound []string `json:"notFound,omitempty"`
	Failed   []string `json:"failed,omitempty"`
}

// SetStudentStatus freezes or unfreezes students. One bad identifier does not
// stop the others: it is reported back so the admin can fix that row.
func (s *UserService) SetStudentStatus(
	ctx context.Context,
	actorID uuid.UUID,
	req StudentStatusRequest,
) (StudentStatusResult, error) {
	note := strings.TrimSpace(req.Note)
	if err := (domain.StatusChange{Status: req.Status, Reason: req.Reason, Note: note}).Validate(); err != nil {
		return StudentStatusResult{}, err
	}

	actor, err := s.GetUserByID(ctx, actorID)
	if err != nil {
		return StudentStatusResult{}, err
	}
	change := domain.StatusChange{
		Status:  req.Status,
		Reason:  req.Reason,
		Note:    note,
		LogLine: statusLogLine(time.Now(), actor.Email, req.Status, req.Reason, note),
	}

	result := StudentStatusResult{}
	seen := make(map[uuid.UUID]struct{}, len(req.Identifiers))
	for _, raw := range req.Identifiers {
		identifier := strings.TrimSpace(raw)
		if identifier == "" {
			continue
		}
		result.Total++

		student, err := s.findStudentByIdentifier(ctx, identifier)
		if errors.Is(err, repository.ErrNotFound) {
			result.NotFound = append(result.NotFound, identifier)
			continue
		}
		if err != nil {
			log.Printf("[UserService.SetStudentStatus] lookup failed: %v", err)
			result.Failed = append(result.Failed, identifier)
			continue
		}

		// The same student listed twice (say by email and by TAZ) counts once.
		if _, duplicate := seen[student.ID]; duplicate {
			continue
		}
		seen[student.ID] = struct{}{}

		if err := s.userRepo.UpdateStudentStatus(ctx, student.ID, change); err != nil {
			log.Printf("[UserService.SetStudentStatus] update failed for %s: %v", student.ID, err)
			result.Failed = append(result.Failed, identifier)
			continue
		}
		result.Updated++
	}
	log.Printf("[UserService.SetStudentStatus] actor=%s status=%s total=%d updated=%d notFound=%d failed=%d",
		actorID, req.Status, result.Total, result.Updated, len(result.NotFound), len(result.Failed))
	return result, nil
}

func (s *UserService) findStudentByIdentifier(ctx context.Context, identifier string) (domain.User, error) {
	var (
		user domain.User
		err  error
	)
	if id, parseErr := uuid.Parse(identifier); parseErr == nil {
		user, err = s.userRepo.FindByID(ctx, id)
	} else if strings.Contains(identifier, "@") {
		user, err = s.userRepo.FindByEmail(ctx, strings.ToLower(identifier))
	} else {
		user, err = s.userRepo.FindByTazIgnoringLeadingZeros(ctx, identifier)
	}
	if err != nil {
		return domain.User{}, err
	}
	if !hasRole(user.Roles, "student") {
		return domain.User{}, repository.ErrNotFound
	}
	return user, nil
}

func statusLogLine(at time.Time, actorEmail string, status domain.StudentStatus, reason domain.FreezeReason, note string) string {
	stamp := at.UTC().Format("2006-01-02 15:04 UTC")
	if status == domain.StudentActive {
		return fmt.Sprintf("%s: unfrozen by %s", stamp, actorEmail)
	}
	line := fmt.Sprintf("%s: frozen by %s (%s)", stamp, actorEmail, reason)
	if note != "" {
		line += ": " + note
	}
	return line
}

// requireNotFrozen returns StudentFrozenError with msg if the student is frozen.
func (s *EntryService) requireNotFrozen(status domain.StudentStatus, msg string) error {
	if status == domain.StudentFrozen {
		return StudentFrozenError{Msg: msg}
	}
	return nil
}
