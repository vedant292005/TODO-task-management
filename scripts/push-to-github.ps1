# Sign in as vedant292005 and push to GitHub (Option A)
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts/push-to-github.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    Write-Host "GitHub CLI not found. Install: winget install GitHub.cli"
    exit 1
}

Write-Host "Step 1: Sign in to GitHub as vedant292005 (browser will open or use device code)."
gh auth login --hostname github.com --git-protocol https --web --scopes repo

Write-Host "`nStep 2: Configure Git to use your GitHub session."
gh auth setup-git

$status = gh auth status 2>&1 | Out-String
if ($status -notmatch "vedant292005") {
    Write-Host "Warning: Active account may not be vedant292005. Check: gh auth status"
}

Write-Host "`nStep 3: Push to origin/main..."
git push -u origin main

Write-Host "`nDone. Repository: https://github.com/vedant292005/TODO-task-management"
