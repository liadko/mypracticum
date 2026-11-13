<#
.SYNOPSIS
    Checks that every contact's JSONB metadata matches its old columns (#18).

.DESCRIPTION
    Read-only. Run it after migration 0028. Every number must be 0 before the
    old contact columns can ever be dropped.

    Run it BEFORE deploying the code that stops writing the old columns. After
    that, any contact edited since will rightly show as different here.

.EXAMPLE
    .\scripts\db\verify-contact-metadata.ps1
#>
param(
    # Use this URL instead of DATABASE_URL from backend\go-app\.env.
    [string]$DatabaseUrl = ''
)

# 'Stop' here means a broken helper file halts the script instead of carrying on.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_common.ps1')

Write-Title 'Verify contact metadata'

Write-Step 1 'Read the connection' @('Read-only: this script only runs a SELECT.')
$url = Get-DatabaseUrl $DatabaseUrl
Write-Ok "Database: $(Get-DbLabel $url)"
Assert-Docker

Write-Step 2 'Compare metadata with the old columns' @(
    'For each contact, every field in contacts.metadata should equal its old column.',
    'IS DISTINCT FROM treats two NULLs as equal, which a plain <> would not.'
)
$checks = [ordered]@{
    'not_backfilled'      = 'metadata IS NULL'
    'email_differs'       = "metadata->>'email' IS DISTINCT FROM email"
    'phone_differs'       = "metadata->>'phone' IS DISTINCT FROM phone"
    'specialty_differs'   = "metadata->>'specialty' IS DISTINCT FROM specialty"
    'institution_differs' = "metadata->>'clientInstitution' IS DISTINCT FROM client_institution"
    'centre_info_differs' = "metadata->>'clientTrainingCenterInfo' IS DISTINCT FROM client_training_center_info"
}
$columns = ($checks.Values | ForEach-Object { "count(*) FILTER (WHERE $_)" }) -join ', '
# @() keeps a one-row result as a list. Without it PowerShell unwraps it to a
# plain string, and [0] would return its first character.
$rows = @(Invoke-Psql $url "select count(*), $columns from contacts")
$numbers = $rows[0] -split '\|'
if ($numbers.Count -ne $checks.Count + 1) { Stop-WithError "Unexpected result from the database: $($rows[0])" }

Write-Ok "Contacts checked: $($numbers[0])"
$problems = 0
$i = 1
foreach ($name in $checks.Keys) {
    $value = [int64]$numbers[$i]
    if ($value -eq 0) { Write-Ok ("{0,-22} 0" -f $name) }
    else { Write-Warn ("{0,-22} {1}" -f $name, $value); $problems += $value }
    $i++
}

if ($problems -gt 0) {
    Stop-WithError 'Some contacts differ. Do not drop the old columns. Send me these numbers.'
}
Write-Title 'All contacts match.'
