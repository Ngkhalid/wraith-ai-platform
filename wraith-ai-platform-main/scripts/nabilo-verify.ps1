$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $projectRoot
try {
    Write-Host '[1/6] Regenerating deterministic datasets'
    python .\tools\data-generator\generate.py
    Write-Host '[2/6] Running API and security tests'
    .\services\api\.venv\Scripts\python.exe -m pytest .\services\api\tests -q
    Write-Host '[3/6] Building FinTech portal'
    npm --prefix .\apps\fintech-portal run build
    Write-Host '[4/6] Building SOC console'
    npm --prefix .\apps\soc-console run build
    Write-Host '[5/6] Testing Sites-compatible workers'
    npm --prefix .\apps\fintech-portal run test:sites
    npm --prefix .\apps\soc-console run test:sites
    Write-Host '[6/6] Validating Docker Compose without starting containers'
    docker compose --env-file .\infra\.env.example -f .\infra\compose.yml config --quiet
    Write-Host 'NABILO VERIFY PASS'
}
finally {
    Pop-Location
}

