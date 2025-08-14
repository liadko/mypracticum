@echo off
cd /d %~dp0

REM ─── Open psql for quick manual queries ──────────────────────────
# start "Postgres Viewer" cmd /k "docker exec -it mypracticum-postgres psql -U postgres -d mypracticum"

REM ─── Run migrations then start auto‐reload server ───────────────
set "DATABASE_URL=postgresql://neondb_owner:npg_YML31gbEKrmH@ep-weathered-flower-a25hq2rj-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
migrate -path db/migrations -database "%DATABASE_URL%" up

air