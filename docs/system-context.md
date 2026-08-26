# MyPracticum: system context

MyPracticum tracks practicum hours for psychotherapy-training schools. It is a Go/Gin + PostgreSQL backend (`backend/go-app`) and a React/Vite frontend (`frontend`). The current school is Temurot; the model is not yet multi-school configurable.

## Core model

- A **user** has a UUID, name, email, optional class/TAZ, optional drawn signature bytes, and one or more roles.
- Important roles: `student`, `mentor`, `admin`, and `analyst`. Authentication is email OTP -> JWT. Roles are JWT claims.
- A **contact** belongs to one student and is exactly one of:
  - `client` — a patient (`מטופל` / `מטופלים`)
  - `mentor` — a supervisor (`מדריך` / `מדריכים`)
  - `therapist` — a personal therapist (`מטפל אישי`)
- Contact metadata currently lives in fixed columns: name, email, phone, specialty, and client-institution/training-centre fields. This is deliberately a known limitation; future schools may need JSONB metadata and likely a separate client-origin/institution entity.
- A mentor contact may point to the canonical mentor user through `contacts.mentor_user_id`. This is how mentor reports connect mentors to their students and events.

## Hours and workflow

- A normal **entry** is one calendar date linked to one contact. It is **always exactly one hour**; there is no per-entry hours field.
- The three normal-entry categories are client, mentor, and therapist.
- Mentor entries begin unapproved. A mentor approval records the approver, and report totals separate approved from pending mentor hours. Client and therapist entries do not use mentor approval.
- A **manual entry** is an admin-entered adjustment/credit for hours that should not be represented as a student-created dated session (for example, a correction or a historical/admin-recorded hour). It has an explicit `hours` value, category (`client`, `mentor`, or `therapist`), required `cause`, creation time, and optional batch ID. Manual mentor hours count as approved; they have no mentor, approval event, or meaningful calendar date.
- A signature is a user-provided image stored on the user. Dashboard `signatureSubmitted` means a signature exists; there is no signature verification or submission timestamp.

## Reporting dashboard

- The dashboard lives at `/reports` and is visible only to JWT roles `admin` or `analyst`. The frontend route guard is helpful UX, but Go authorization is the security boundary.
- Go protects `/api/v1/reports/*` with `RequireAnyRole("admin", "analyst")`.
- Student reports provide paginated/searchable/sortable student summaries, classes, a per-student dated event calendar, manual-entry detail, and the student's contacts.
- Mentor reports provide paginated/searchable/sortable mentor summaries, linked students, and all regular mentor events made by those students. Manual entries are intentionally excluded from mentor totals/calendar because they are not tied to a mentor.
- List endpoints use `query`, `page`, `limit`, `sortBy`, and `sortDirection`; students additionally support `class`. Responses include `total` and `totalPages`.
- Frontend report code is isolated under `frontend/src/pages/Reports`. Scope CSS under `.reports-root`: legacy app styles contain global `button` rules that otherwise leak into the dashboard.

## Regular API landmarks

- Authenticated base: `/api/v1`.
- Students manage their own `/entries` and `/contacts`; `PATCH /entries/:entryId/approval` changes mentor-entry approval.
- Admin operations include student import, bulk regular-entry approval/deletion, and bulk manual-entry add/delete under `/api/v1/admin/...`.
- Report endpoints: `/api/v1/reports/classes`, `/students`, `/students/:studentId`, `/mentors`, `/mentors/:mentorId`.

## Working conventions

- DB migrations are versioned in `backend/go-app/db/migrations`; use a new migration rather than editing an applied one.
- Firebase Hosting serves the frontend; Cloud Run serves Go and Firebase rewrites `/api/v1/**` to it. Build the frontend before hosting deployment.
- Do not place database URLs, JWT secrets, or other credentials in source, docs, commits, or logs. Production secrets belong in the existing deployment/secret configuration.
