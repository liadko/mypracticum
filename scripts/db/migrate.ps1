<#
.SYNOPSIS
    Applies the next database migration(s), one step at a time by default.

.DESCRIPTION
    Uses golang-migrate, the same tool as before. It keeps a one-row table,
    schema_migrations, holding the number of the last applied file and a "dirty"
    flag. "up 1" runs the next file only and moves that number forward.

    Files are read from backend\go-app\db\migrations in THIS checkout, so pull
    main first.

    Order for the current work (each step is one run of this script):
        0027  add contacts.metadata         before deploying the JSONB backend
        0028  backfill contacts.metadata    after that deploy, then run verify-contact-metadata.ps1
        0029  add users.status              before deploying the freeze backend

.EXAMPLE
    .\scripts\db\migrate.ps1              # shows what will run, asks, applies one file
    .\scripts\db\migrate.ps1 -StatusOnly  # just shows where the database is
#>
param(
    # How many migration files to apply.
    [int]$Steps = 1,
    # Show the current version and what is pending, then stop.
    [switch]$StatusOnly,
    # Skip the confirmation question.
    [switch]$Yes,
    # Use this URL instead of DATABASE_URL from backend\go-app\.env.
    [string]$DatabaseUrl = ''
)

# 'Stop' here means a broken helper file halts the script instead of carrying on.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_common.ps1')

# Runs golang-migrate: the migrate.exe you installed with "go install" if it is
# on PATH, otherwise the official Docker image. Its messages go to stderr, so
# they are collected and returned as plain text.
function Invoke-Migrate([string[]]$Arguments) {
    if (Get-Command migrate -ErrorAction SilentlyContinue) {
        Push-Location $GoApp
        try { $out = & migrate -path db/migrations -database $script:url @Arguments 2>&1 }
        finally { Pop-Location }
    } else {
        $out = & docker run --rm -v "${MigrationsDir}:/migrations:ro" $MigrateImage -path=/migrations -database $script:url @Arguments 2>&1
    }
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Text = (($out | ForEach-Object { "$_" }) -join "`n").Trim() }
}

function Get-CurrentVersion {
    $result = Invoke-Migrate @('version')
    if ($result.Text -match 'no migration') { return [pscustomobject]@{ Version = 0; Dirty = $false } }
    if ($result.ExitCode -ne 0 -or $result.Text -notmatch '(\d+)') { Stop-WithError "Could not read the version: $($result.Text)" }
    return [pscustomobject]@{ Version = [int]$Matches[1]; Dirty = ($result.Text -match 'dirty') }
}

Write-Title 'Database migration'

Write-Step 1 'Read the connection' @(
    'DATABASE_URL from backend\go-app\.env, switched to Neon''s direct endpoint.',
    'Migrations take a lock that the pooler can''t hold, so they need the direct one.'
)
$script:url = Get-DatabaseUrl $DatabaseUrl
Write-Ok "Database: $(Get-DbLabel $script:url)"
$tool = if (Get-Command migrate -ErrorAction SilentlyContinue) { 'migrate.exe (installed)' } else { Assert-Docker; "$MigrateImage (Docker)" }
Write-Ok "Tool: $tool"

Write-Step 2 'Check which files you have' @(
    'Migrations come from your checkout. If you have not pulled the merged PR, the new file will not be here.'
)
$branch = (git -C $RepoRoot branch --show-current) 2>$null
$files = Get-ChildItem $MigrationsDir -Filter '*.up.sql' | Sort-Object Name
Write-Ok "Branch: $branch"
Write-Ok "Newest file here: $($files[-1].Name)"
if ($branch -ne 'main') { Write-Warn 'You are not on main. Make sure this is the code you mean to migrate with.' }

Write-Step 3 'Ask the database where it is' @(
    'schema_migrations holds the number of the last file applied.',
    '"dirty" means a migration started and failed halfway; that needs a human before anything else runs.'
)
$current = Get-CurrentVersion
if ($current.Dirty) {
    Stop-WithError "Version $($current.Version) is marked dirty. Check what that file did, fix the database by hand, then run: migrate -path db/migrations -database <url> force $($current.Version)"
}
Write-Ok "Database is at version $($current.Version)"

$pending = @($files | Where-Object { [int]($_.Name.Substring(0, 4)) -gt $current.Version })
if ($pending.Count -eq 0) {
    Write-Title 'Nothing to do: the database already has every migration in this checkout.'
    exit 0
}
Write-Info "Pending: $(($pending | ForEach-Object { $_.Name }) -join ', ')"

$toRun = $pending | Select-Object -First $Steps
Write-Step 4 'What will run' @('The comment at the top of each file explains it:')
foreach ($file in $toRun) {
    Write-Host ''
    Write-Host "    $($file.Name)" -ForegroundColor White
    Get-Content $file.FullName | Where-Object { $_ -match '^\s*--' } | Select-Object -First 12 | ForEach-Object {
        Write-Host "      $($_.Trim())" -ForegroundColor DarkGray
    }
}

if ($StatusOnly) {
    Write-Title 'Status only: nothing was changed.'
    exit 0
}

Write-Step 5 'Confirm' @(
    'Take a backup first (scripts\db\backup.ps1) if you have not today.'
)
if (-not $Yes) {
    $answer = Read-Host "    Apply $($toRun.Count) migration(s) to $(Get-DbLabel $script:url)? Type yes"
    if ($answer -ne 'yes') { Write-Title 'Cancelled: nothing was changed.'; exit 0 }
}

Write-Step 6 "Apply (migrate up $Steps)" @(
    'Postgres runs each of our files as one transaction: all of it applies, or none of it does.'
)
$result = Invoke-Migrate @('up', "$Steps")
if ($result.Text) { $result.Text -split "`n" | ForEach-Object { Write-Info $_ } }
if ($result.ExitCode -ne 0) { Stop-WithError 'migrate reported an error (see above). Run this script with -StatusOnly to see the state.' }

Write-Step 7 'Confirm the new version' @()
$after = Get-CurrentVersion
Write-Ok "Database is now at version $($after.Version)"

Write-Title "Done: $($current.Version) -> $($after.Version)"
