$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root "frontend"
$frontendEnv = Join-Path $frontendDir ".env.local"
$frontendEnvExample = Join-Path $frontendDir ".env.local.example"

if (-not (Test-Path $frontendEnv) -and (Test-Path $frontendEnvExample)) {
    Copy-Item $frontendEnvExample $frontendEnv
}

$backendCommand = @"
Set-Location '$root'
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
"@

$frontendCommand = @"
Set-Location '$frontendDir'
npm run dev
"@

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendCommand
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $frontendCommand
)

$networkAddresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress -Unique

Write-Host "Backend:  http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
foreach ($address in $networkAddresses) {
    Write-Host "Backend LAN:  http://$address`:8000"
    Write-Host "Frontend LAN: http://$address`:3000"
}
