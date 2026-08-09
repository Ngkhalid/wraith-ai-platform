$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pidRoot = Join-Path $projectRoot '.nabilo\pids'
if (-not (Test-Path $pidRoot)) { Write-Host 'No managed demo processes found.'; exit 0 }

foreach ($name in @('api','fintech','soc')) {
    $pidFile = Join-Path $pidRoot "$name.pid"
    if (-not (Test-Path $pidFile)) { continue }
    $processId = [int](Get-Content -Raw $pidFile)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -like "*$projectRoot*") {
        Stop-Process -Id $processId
        Write-Host "$name stopped (PID $processId)"
    } elseif ($process) {
        Write-Warning "Skipped unrelated process recorded in $pidFile"
    }
    Remove-Item -LiteralPath $pidFile -Force
}
