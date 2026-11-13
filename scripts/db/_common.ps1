# Shared helpers for the database scripts. Dot-sourced by the others, not run directly.
#
# Every Postgres tool (pg_dump, pg_restore, psql) runs inside the official
# postgres:18 Docker image, so nothing has to be installed on Windows. A tool
# version 18 can read a version 17 server like Neon's; the reverse is not true.

# Programs like docker and psql print progress on stderr. Windows PowerShell 5.1
# would treat that as a failure under 'Stop', so each call checks its exit code
# instead.
$ErrorActionPreference = 'Continue'

$RepoRoot      = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$GoApp         = Join-Path $RepoRoot 'backend\go-app'
$MigrationsDir = Join-Path $GoApp 'db\migrations'
$BackupRoot    = Join-Path $RepoRoot 'backend\tmp\backups'   # gitignored
$PostgresImage = 'postgres:18'
$MigrateImage  = 'migrate/migrate:v4.18.1'

function Write-Title([string]$Text) {
    Write-Host ''
    Write-Host ('=' * 64) -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 64) -ForegroundColor DarkCyan
}

# Prints a numbered step and a few lines on what it does and why.
function Write-Step([string]$Number, [string]$Title, [string[]]$Explain) {
    Write-Host ''
    Write-Host "[$Number] $Title" -ForegroundColor Cyan
    foreach ($line in $Explain) { Write-Host "    $line" -ForegroundColor DarkGray }
}

function Write-Ok([string]$Text)   { Write-Host "    OK   $Text" -ForegroundColor Green }
function Write-Info([string]$Text) { Write-Host "    ..   $Text" }
function Write-Warn([string]$Text) { Write-Host "    !!   $Text" -ForegroundColor Yellow }

function Stop-WithError([string]$Text) {
    Write-Host ''
    Write-Host "STOPPED: $Text" -ForegroundColor Red
    exit 1
}

# Reads DATABASE_URL from backend/go-app/.env (or takes an override) and turns
# it into a URL the standard Postgres tools accept:
#   * "-pooler" is removed from the host. Neon's pooler hands each statement to
#     whichever connection is free, which breaks pg_dump and migration locks.
#     The direct endpoint is a normal single Postgres connection.
#   * prefer_simple_protocol is dropped. Only the app's Go driver knows it; the
#     standard tools reject unknown options.
function Get-DatabaseUrl([string]$Override) {
    if ($Override) {
        $raw = $Override
    } else {
        $envFile = Join-Path $GoApp '.env'
        if (-not (Test-Path $envFile)) { Stop-WithError "No $envFile and no -DatabaseUrl given." }
        $line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
        if (-not $line) { Stop-WithError "DATABASE_URL is not set in $envFile." }
        $raw = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
    }

    $url = $raw -replace '-pooler\.', '.'
    if ($url -match '^(?<base>[^?]+)\?(?<query>.*)$') {
        # Copy the groups first: the -notmatch below overwrites $Matches.
        $base, $query = $Matches.base, $Matches.query
        $kept = $query -split '&' | Where-Object { $_ -and $_ -notmatch '^(prefer_simple_protocol|default_query_exec_mode)=' }
        $url = $base
        if ($kept) { $url += '?' + ($kept -join '&') }
    }
    return $url
}

# The host and database name only, so the password is never printed.
function Get-DbLabel([string]$Url) {
    if ($Url -match '@(?<host>[^/:?]+)(:\d+)?/(?<db>[^?]+)') { return "$($Matches.db) on $($Matches.host)" }
    return '(unrecognised URL)'
}

function Assert-Docker {
    docker info --format '{{.ServerVersion}}' *> $null
    if ($LASTEXITCODE -ne 0) { Stop-WithError 'Docker is not running. Start Docker Desktop and try again.' }
}

# Runs one SQL statement with psql and returns the rows as "a|b|c" strings.
# Note: keep double quotes out of the SQL; Windows PowerShell 5.1 mangles them
# when passing arguments to programs.
function Invoke-Psql([string]$Url, [string]$Sql) {
    $out = docker run --rm $PostgresImage psql $Url -v ON_ERROR_STOP=1 -At -c $Sql 2>&1
    if ($LASTEXITCODE -ne 0) { Stop-WithError "psql failed: $($out -join ' ')" }
    return @($out | ForEach-Object { "$_" } | Where-Object { $_ -ne '' })
}

# Row counts of every table in the public schema, as an ordered name -> count map.
function Get-TableCounts([string]$Url) {
    $tables = @(Invoke-Psql $Url "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1")
    $query = ($tables | ForEach-Object { "select '$_', count(*) from public.$_" }) -join ' union all '
    if (-not $tables) { Stop-WithError 'No tables found. Is this the right database?' }
    $counts = [ordered]@{}
    foreach ($row in (Invoke-Psql $Url $query)) {
        $name, $count = $row -split '\|'
        $counts[$name] = [int64]$count
    }
    return $counts
}
