<#
.SYNOPSIS
    Backs up the whole database and proves the backup restores.

.DESCRIPTION
    1. pg_dump writes the database to a file under backend\tmp\backups (gitignored).
    2. A throwaway local Postgres is started, the file is restored into it, and
       every table's row count is compared with the live database.
    3. The throwaway Postgres is deleted. Nothing is ever written to the live database.

    A backup you have never restored is only a hope; step 2 makes it a fact.

.EXAMPLE
    .\scripts\db\backup.ps1
    .\scripts\db\backup.ps1 -Label before-jsonb
#>
param(
    # Added to the folder name, e.g. "before-jsonb".
    [string]$Label = '',
    # Use this URL instead of DATABASE_URL from backend\go-app\.env.
    [string]$DatabaseUrl = ''
)

# 'Stop' here means a broken helper file halts the script instead of carrying on.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_common.ps1')

Write-Title 'Database backup'

Write-Step 1 'Read the connection' @(
    'DATABASE_URL comes from backend\go-app\.env.',
    'It is switched to Neon''s direct endpoint; pg_dump needs one steady connection.'
)
$url = Get-DatabaseUrl $DatabaseUrl
Write-Ok "Database: $(Get-DbLabel $url)"
Assert-Docker
Write-Ok 'Docker is running'

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$folderName = if ($Label) { "$stamp-$Label" } else { $stamp }
$folder = Join-Path $BackupRoot $folderName
New-Item -ItemType Directory -Force -Path $folder | Out-Null

Write-Step 2 'Dump the database (pg_dump)' @(
    'pg_dump reads every table inside one transaction, so the copy is a single',
    'consistent moment in time even if someone is using the site right now.',
    'Two files: neondb.dump (compact, for pg_restore) and neondb.sql (plain SQL you can read).'
)
docker run --rm -v "${folder}:/out" $PostgresImage pg_dump $url -Fc --no-owner --no-privileges -f /out/neondb.dump
if ($LASTEXITCODE -ne 0) { Stop-WithError 'pg_dump failed (custom format).' }
docker run --rm -v "${folder}:/out" $PostgresImage pg_dump $url --no-owner --no-privileges -f /out/neondb.sql
if ($LASTEXITCODE -ne 0) { Stop-WithError 'pg_dump failed (plain SQL).' }
Get-ChildItem $folder | ForEach-Object { Write-Ok ("{0,-12} {1,8:N0} KB" -f $_.Name, ($_.Length / 1KB)) }

Write-Step 3 'Count rows in the live database' @(
    'These numbers are what the restored copy must match.'
)
$liveCounts = Get-TableCounts $url
foreach ($table in $liveCounts.Keys) { Write-Info ("{0,-20} {1,8:N0}" -f $table, $liveCounts[$table]) }

Write-Step 4 'Restore into a throwaway Postgres' @(
    'A temporary container on this machine only. The live database is not touched.'
)
$container = "mp-backup-check-$stamp"
docker run -d --name $container -e POSTGRES_PASSWORD=check -v "${folder}:/out:ro" $PostgresImage | Out-Null
try {
    $ready = $false
    for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
        Start-Sleep -Seconds 1
        docker exec $container pg_isready -q -U postgres *> $null
        $ready = ($LASTEXITCODE -eq 0)
    }
    if (-not $ready) { Stop-WithError 'The throwaway Postgres did not start.' }
    Start-Sleep -Seconds 2   # pg_isready can answer just before the server finishes starting

    # The dump expects this extension (it provides uuid_generate_v4) to exist.
    # Sent on stdin because PowerShell 5.1 garbles double quotes in arguments.
    'create extension if not exists "uuid-ossp";' | docker exec -i $container psql -U postgres -q | Out-Null
    $restoreOutput = docker exec $container pg_restore -U postgres -d postgres --no-owner /out/neondb.dump 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Warn "pg_restore reported: $($restoreOutput -join ' ')" }
    Write-Ok 'Restored'

    Write-Step 5 'Compare row counts' @(
        'Every table must have exactly as many rows as the live one.'
    )
    $localUrl = 'postgres://postgres:check@localhost:5432/postgres'
    $restoredCounts = @{}
    $tables = docker exec $container psql $localUrl -At -c "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'"
    foreach ($table in $tables) {
        $restoredCounts["$table"] = [int64](docker exec $container psql $localUrl -At -c "select count(*) from public.$table")
    }

    $mismatches = 0
    foreach ($table in $liveCounts.Keys) {
        $live = $liveCounts[$table]
        $restored = $restoredCounts[$table]
        if ($restored -eq $live) {
            Write-Ok ("{0,-20} {1,8:N0}" -f $table, $restored)
        } else {
            Write-Warn ("{0,-20} live {1}, restored {2}" -f $table, $live, $restored)
            $mismatches++
        }
    }
} finally {
    docker rm -f $container | Out-Null
}

if ($mismatches -gt 0) {
    Stop-WithError "$mismatches table(s) differ. If someone was using the site during the dump, run this again. Do not migrate yet."
}

Write-Title "Backup verified: $folder"
