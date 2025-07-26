@echo off
cd /d %~dp0

REM ─── Open psql for quick manual queries ──────────────────────────
start "Postgres Viewer" cmd /k "docker exec -it mypracticum-postgres psql -U postgres -d mypracticum"

REM ─── Run migrations then start auto‐reload server ───────────────
set "DATABASE_URL=postgres://postgres:mypassword@localhost:5432/mypracticum?sslmode=disable"
migrate -path db/migrations -database "%DATABASE_URL%" up

air