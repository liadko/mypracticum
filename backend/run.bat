@echo off

REM ─── Open psql for quick manual queries ──────────────────────────
start "Postgres Viewer" cmd /k "docker exec -it mypracticum-postgres psql -U postgres -d mypracticum"

set "DATABASE_URL=postgres://postgres:PostgresKodi555@localhost:5432/mypracticum?sslmode=disable"
migrate -path db/migrations -database "%DATABASE_URL%" up
air

