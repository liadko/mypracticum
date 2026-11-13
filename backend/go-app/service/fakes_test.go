package service

import (
	"context"
	"time"

	"mypracticum/backend/domain"
	"mypracticum/backend/repository"

	"github.com/google/uuid"
)

// Each fake embeds the repository interface it stands in for. Go promotes the
// embedded interface's methods, so the fake satisfies the whole interface while
// only overriding what a test uses. Calling anything else panics on the nil
// embedded value, which is what we want: an unexpected repository call fails
// the test loudly.

type fakeEntryRepo struct {
	repository.EntryRepo

	status      domain.StudentStatus
	usage       domain.PrivateClinicUsage
	usageErr    error
	cutoff      *time.Time
	cutoffErr   error
	createErr   error
	created     []domain.Entry
	deleteErr   error
	linked      bool
	linkErr     error
	approverSet **uuid.UUID
	updateErr   error
}

func (f *fakeEntryRepo) UserStatus(context.Context, uuid.UUID) (domain.StudentStatus, error) {
	return f.status, nil
}

func (f *fakeEntryRepo) EntryOwnerStatus(context.Context, uuid.UUID) (domain.StudentStatus, error) {
	return f.status, nil
}

func (f *fakeEntryRepo) PrivateClinicUsage(context.Context, uuid.UUID, uuid.UUID) (domain.PrivateClinicUsage, error) {
	if f.usage.Cap == 0 && f.usageErr == nil {
		return domain.PrivateClinicUsage{Cap: domain.DefaultPrivateClinicCap}, nil
	}
	return f.usage, f.usageErr
}

func (f *fakeEntryRepo) FindClassStartDateForEntry(context.Context, uuid.UUID, uuid.UUID) (*time.Time, error) {
	return f.cutoff, f.cutoffErr
}

func (f *fakeEntryRepo) Create(_ context.Context, e domain.Entry) (domain.Entry, error) {
	if f.createErr != nil {
		return domain.Entry{}, f.createErr
	}
	f.created = append(f.created, e)
	return e, nil
}

func (f *fakeEntryRepo) DeleteIfNotApproved(context.Context, uuid.UUID, uuid.UUID) error {
	return f.deleteErr
}

func (f *fakeEntryRepo) IsEntryLinkedToMentor(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return f.linked, f.linkErr
}

func (f *fakeEntryRepo) UpdateApproval(_ context.Context, id uuid.UUID, approver *uuid.UUID) (domain.Entry, error) {
	if f.updateErr != nil {
		return domain.Entry{}, f.updateErr
	}
	f.approverSet = &approver
	return domain.Entry{ID: id, Approved: approver != nil}, nil
}

type fakeUserRepo struct {
	repository.UserRepo

	users   map[string]domain.User // by email
	created []domain.User
	changes map[uuid.UUID]domain.StatusChange
}

func (f *fakeUserRepo) FindByTazIgnoringLeadingZeros(_ context.Context, taz string) (domain.User, error) {
	for _, u := range f.users {
		if u.Taz == taz {
			return u, nil
		}
	}
	return domain.User{}, repository.ErrNotFound
}

func (f *fakeUserRepo) UpdateStudentStatus(_ context.Context, id uuid.UUID, change domain.StatusChange) error {
	if f.changes == nil {
		f.changes = map[uuid.UUID]domain.StatusChange{}
	}
	f.changes[id] = change
	return nil
}

func (f *fakeUserRepo) FindByID(_ context.Context, id uuid.UUID) (domain.User, error) {
	for _, u := range f.users {
		if u.ID == id {
			return u, nil
		}
	}
	return domain.User{}, repository.ErrNotFound
}

func (f *fakeUserRepo) FindByEmail(_ context.Context, email string) (domain.User, error) {
	if u, ok := f.users[email]; ok {
		return u, nil
	}
	return domain.User{}, repository.ErrNotFound
}

func (f *fakeUserRepo) CreateUser(_ context.Context, u domain.User) (domain.User, error) {
	f.created = append(f.created, u)
	f.users[u.Email] = u
	return u, nil
}

type fakeContactRepo struct {
	repository.ContactRepo

	mentorExists bool
	created      []domain.Contact
	updated      []domain.Contact
	updateErr    error
}

func (f *fakeContactRepo) UserHasMentorExcept(context.Context, uuid.UUID, string, uuid.UUID) (bool, error) {
	return f.mentorExists, nil
}

func (f *fakeContactRepo) Create(_ context.Context, _ uuid.UUID, c domain.Contact) (domain.Contact, error) {
	f.created = append(f.created, c)
	return c, nil
}

func (f *fakeContactRepo) Update(_ context.Context, _, _ uuid.UUID, c domain.Contact) (domain.Contact, error) {
	if f.updateErr != nil {
		return domain.Contact{}, f.updateErr
	}
	f.updated = append(f.updated, c)
	return c, nil
}
