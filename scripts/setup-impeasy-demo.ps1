param(
  [string]$DatabaseUrl = "postgresql://postgres:postgres@localhost:5432/impeasy",
  [string]$ApiPort = "3001",
  [string]$WebPort = "3000"
)

Write-Host "=== IMPEasy demo setup starting ===" -ForegroundColor Cyan

try {
  # Ensure we are in the repo root (enr)
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $repoRoot = Resolve-Path (Join-Path $scriptDir "..")
  Set-Location $repoRoot
  Write-Host "Working directory: $repoRoot"

  # Stop any existing Node / npm / npx processes (old dev servers)
  Write-Host "Stopping existing Node-related processes (if any)..." -ForegroundColor Yellow
  foreach ($name in @("node", "npm", "npx")) {
    $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
    if ($procs) {
      Write-Host "  Stopping processes: $name" -ForegroundColor DarkYellow
      $procs | Stop-Process -Force -ErrorAction SilentlyContinue
    }
  }

  # Relax execution policy for this session only
  Write-Host "Setting execution policy for this process..." -ForegroundColor Yellow
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

  # Core environment used by Prisma, API and seed scripts
  $env:DATABASE_URL = $DatabaseUrl
  $env:IMPEASY_DATABASE_URL = $DatabaseUrl
  $env:IMPEASY_API_URL = "http://localhost:$ApiPort"
  $env:IMPEASY_WEB_URL = "http://localhost:$WebPort"
  $env:IMPEASY_DEMO_PASSWORD = "StrongPass1!"
  $env:IMPEASY_ADMIN_EMAIL = "admin@impeasy.local"
  $env:IMPEASY_ADMIN_PASSWORD = "Admin123!"
  $env:PORT = $ApiPort

  Write-Host "Using DATABASE_URL = $DatabaseUrl"
  Write-Host "API will run on port $ApiPort"
  Write-Host "Web will run on port $WebPort"

  # 1) Reset database and apply all migrations
  Write-Host "`n[1/4] Resetting database and applying migrations..." -ForegroundColor Yellow
  npx prisma migrate reset --force

  # 2) Start API server in a new window (needed for HTTP-based seeds)
  Write-Host "`n[2/4] Starting API server in a new PowerShell window..." -ForegroundColor Yellow
  $apiCommand = "cd `"$repoRoot`"; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; " +
                "`$env:DATABASE_URL = `"$DatabaseUrl`"; " +
                "`$env:IMPEASY_DATABASE_URL = `"$DatabaseUrl`"; " +
                "`$env:PORT = `"$ApiPort`"; " +
                "npm --workspace @impeasy/api run start:dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCommand | Out-Null

  # Give API a moment to boot
  Write-Host "Waiting for API to start..." -ForegroundColor Yellow
  Start-Sleep -Seconds 10

  # 3) Run all rich seed scripts (now that API is up)
  Write-Host "`n[3/4] Seeding admin user..." -ForegroundColor Yellow
  npm run seed:admin

  Write-Host "`n[3/4] Seeding MVP-010 users..." -ForegroundColor Yellow
  npm run seed:mvp-010-users

  Write-Host "`n[3/4] Seeding MVP-020 demo data..." -ForegroundColor Yellow
  npm run seed:mvp-020-demo

  Write-Host "`n[3/4] Seeding MVP-030 demo data..." -ForegroundColor Yellow
  npm run seed:mvp-030-demo

  Write-Host "`n[3/4] Seeding MVP-040 demo data..." -ForegroundColor Yellow
  npm run seed:mvp-040-demo

  # 4) Start Web server in a new window
  Write-Host "`n[4/4] Starting Web server in a new PowerShell window..." -ForegroundColor Yellow
  $webCommand = "cd `"$repoRoot`"; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; " +
                "`$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:$ApiPort'; " +
                "`$env:PORT = `"$WebPort`"; " +
                "npm --workspace @impeasy/web run dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCommand | Out-Null

  Write-Host "`n=== IMPEasy demo setup complete ===" -ForegroundColor Green
  Write-Host "Open your browser to: http://localhost:$WebPort"
  Write-Host "Try logging in with:"
  Write-Host "  admin.review@impeasy.local / StrongPass1!"
  Write-Host "  or admin@impeasy.local / Admin123!"
}
catch {
  Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

