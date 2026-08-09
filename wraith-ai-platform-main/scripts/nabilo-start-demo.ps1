$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$stateRoot = Join-Path $projectRoot '.nabilo'
$logRoot = Join-Path $stateRoot 'logs'
$pidRoot = Join-Path $stateRoot 'pids'
New-Item -ItemType Directory -Force -Path $logRoot, $pidRoot | Out-Null

function Start-NabiloProcess {
    param([string]$Name, [int]$Port, [string]$FilePath, [string[]]$ArgumentList, [string]$WorkingDirectory)
    $pidFile = Join-Path $pidRoot "$Name.pid"
    $existingListener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existingListener) {
        $existingProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($existingListener.OwningProcess)"
        if ($existingProcess.CommandLine -notlike "*$projectRoot*") { throw "Port $Port is occupied by an unrelated process." }
        Set-Content -Path $pidFile -Value $existingListener.OwningProcess
        Write-Host "$Name already running (PID $($existingListener.OwningProcess))"
        return
    }
    $stdout = Join-Path $logRoot "$Name.out.log"
    $stderr = Join-Path $logRoot "$Name.err.log"
    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    $listener = $null
    for ($attempt = 0; $attempt -lt 40 -and -not $listener; $attempt++) {
        Start-Sleep -Milliseconds 250
        $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if (-not $listener) { throw "$Name did not start on port $Port. Check $stderr" }
    Set-Content -Path $pidFile -Value $listener.OwningProcess
    Write-Host "$Name started (PID $($listener.OwningProcess))"
}

$pythonExe = Join-Path $projectRoot 'services\api\.venv\Scripts\python.exe'
if (-not (Test-Path $pythonExe)) { throw "API virtual environment missing: $pythonExe" }

Start-NabiloProcess -Name 'api' -Port 8000 -FilePath $pythonExe -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory (Join-Path $projectRoot 'services\api')
Start-NabiloProcess -Name 'fintech' -Port 5173 -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--host','127.0.0.1','--port','5173') -WorkingDirectory (Join-Path $projectRoot 'apps\fintech-portal')
Start-NabiloProcess -Name 'soc' -Port 5174 -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--host','127.0.0.1','--port','5174') -WorkingDirectory (Join-Path $projectRoot 'apps\soc-console')

Write-Host 'FinTech: http://127.0.0.1:5173'
Write-Host 'SOC:     http://127.0.0.1:5174'
Write-Host 'API:     http://127.0.0.1:8000/api/v1/ready'
