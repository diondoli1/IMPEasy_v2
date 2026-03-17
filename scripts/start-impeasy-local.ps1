param(
  [string]$DatabaseUrl = "postgresql://postgres:postgres@localhost:5432/impeasy",
  [string]$ApiPort = "3001",
  [string]$WebPort = "3000"
)

Write-Host "=== IMPEasy local start ===" -ForegroundColor Cyan

try {
  # Ensure we are in the repo root (enr)
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $repoRoot = Resolve-Path (Join-Path $scriptDir "..")
  Set-Location $repoRoot
  Write-Host "Working directory: $repoRoot"

  # Relax execution policy for this session only
  Write-Host "Setting execution policy for this process..." -ForegroundColor Yellow
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

  # Core environment used by Prisma, API and web app
  $env:DATABASE_URL = $DatabaseUrl
  $env:IMPEASY_DATABASE_URL = $DatabaseUrl
  $env:IMPEASY_API_URL = "http://localhost:$ApiPort"
  $env:IMPEASY_WEB_URL = "http://localhost:$WebPort"
  $env:PORT = $ApiPort

  Write-Host "Using DATABASE_URL = $DatabaseUrl"
  Write-Host "API will run on port $ApiPort"
  Write-Host "Web will run on port $WebPort"

  # 1) Start API server in a new window
  Write-Host "`n[1/2] Starting API server in a new PowerShell window..." -ForegroundColor Yellow
  $apiCommand = "cd `"$repoRoot`"; " +
                "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; " +
                "`$env:DATABASE_URL = `"$DatabaseUrl`"; " +
                "`$env:IMPEASY_DATABASE_URL = `"$DatabaseUrl`"; " +
                "`$env:PORT = `"$ApiPort`"; " +
                "npm --workspace @impeasy/api run start:dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCommand | Out-Null

  # 2) Start Web server in a new window
  Write-Host "`n[2/2] Starting Web server in a new PowerShell window..." -ForegroundColor Yellow
  $webCommand = "cd `"$repoRoot`"; " +
                "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; " +
                "`$env:NEXT_PUBLIC_API_BASE_URL = `"http://localhost:$ApiPort`"; " +
                "`$env:PORT = `"$WebPort`"; " +
                "npm --workspace @impeasy/web run dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCommand | Out-Null

  Write-Host "`n=== IMPEasy local start complete ===" -ForegroundColor Green
  Write-Host "Open your browser to: http://localhost:$WebPort"
}
catch {
  Write-Host "Start failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

