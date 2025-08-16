@echo off
cd /d %~dp0

REM ─── Run migrations ───────────────
set "DATABASE_URL=postgresql://neondb_owner:npg_YML31gbEKrmH@ep-weathered-flower-a25hq2rj-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&prefer_simple_protocol=true"
migrate -path db/migrations -database "%DATABASE_URL%" up

