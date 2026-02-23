$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$demoDir = Join-Path $repoRoot 'demo'
$wrapper = Join-Path $demoDir 'mvnw.cmd'

if (-not (Test-Path $wrapper)) {
    throw "Could not find Maven wrapper at: $wrapper"
}

Push-Location $demoDir
try {
    & $wrapper spring-boot:run
} finally {
    Pop-Location
}
