# MyPracticum

A full-stack platform for psychotherapy training programs—such as Temurot School for Psychotherapy—to manage students’ practical hours.

* Students log sessions with clients, mentors, or therapists.
* Administrators review and approve logged hours.
* Generate comprehensive progress reports.


---

## 📊 Recent Update - Backend Architecture

<h3 align="center">Previous Architecture</h3>

<p align="center">
  <img src="docs/old-architecture.png" alt="Previous Architecture" width="600" />
</p>

---

<h3 align="center">New Architecture</h3>

<p align="center">
  <img src="docs/new-architecture.png" alt="New Architecture" width="900" />
</p>

---

## 🚀 Features

- **User lookup** by government student-ID → internal UUID  
- **Contacts CRUD** (clients, mentors, therapists) with type-and-specialty validation  
- **Entries CRUD** on a calendar UI with optimistic updates  
- **Approval workflow** (coming soon): email mentors to approve hours  
- **Dashboard & reporting** (planned): see who’s behind, export CSV/PDF  

---

## 🛠 Backend

Built in Go with Gin and PostgreSQL, following a layered architecture:

- **Domain**: pure types & validation (`Entry`, `Contact`, helpers)  
- **Repository**: interfaces + Postgres implementations (context-aware SQL)  
- **Service**: use-case orchestration (business rules, validation, multi-repo flows)  
- **Handler**: thin HTTP layer (Gin handlers bind → call services → JSON)  
- **Middleware**: CORS + AuthMiddleware (resolves `studentId` → `userID`, injects into context)  

**Quick start**  
```bash
# 1. Run Postgres (password/mypassword, DB=mypracticum)
docker run -d --name practicum-pg -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=mypracticum -p 5432:5432 postgres:15-alpine

# 2. Apply migrations
psql postgres://postgres:mypassword@localhost:5432/mypracticum \
  -f migrations/0001_init_schema.up.sql \
  -f migrations/0002_add_date_and_drop_hours.up.sql

# 3. Start backend
cd backend
go run main.go
```

---

## 🌐 Frontend

A React + Vite + TypeScript SPA with:

* Contexts for Contacts & Entries state
* Calendar-based entry logging
* Optimistic UI updates on create/delete
* Select dropdowns and list layouts

**Quick start**

```bash
cd frontend
npm install
npm run dev
# Ensure VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 🔜 Roadmap

1. **Mentor approvals** via email links
2. **Admin dashboard** for progress reports and late-hour alerts
3. **Authentication** with JWT login & refresh tokens
4. **Notifications** (email/SMS reminders)
5. **Automated tests** (unit, integration, handler)

---

<small>© 2025 MyPracticum — built with clean‐architecture principles for maintainability and testability.</small>


