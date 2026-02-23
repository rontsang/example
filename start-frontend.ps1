param(
    [string]$App = 'demo-client',
    [switch]$Install,
    [int]$Port = 4200
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $repoRoot $App

if (-not (Test-Path $appDir)) {
    throw "Frontend folder not found: $appDir"
}

$packageJson = Join-Path $appDir 'package.json'
if (-not (Test-Path $packageJson)) {
    throw "package.json not found in: $appDir"
}

Push-Location $appDir
try {
    if ($Install -or -not (Test-Path (Join-Path $appDir 'node_modules'))) {
        npm install
    }

    npm start -- --port $Port
} finally {
    Pop-Location
}
