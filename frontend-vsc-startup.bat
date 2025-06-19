@echo off
REM ─── Start Postgres & any other services ───────────────────────────
cd /d %~dp0
start "Docker" docker-compose up --build

REM frontend window
call code -n "%~dp0\mypracticum.code-workspace\"

REM backend window
call code -n "%~dp0\backend\backend.code-workspace"

