# =============================================================================
# AGRILION — Arranque de todos los servicios (Windows PowerShell)
# =============================================================================
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/start_agrilion.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/start_agrilion.ps1 -WithWeb
#
# Abre ventanas separadas para:
#   1. AI API          (Inteligencia_Artificial, puerto 8000)
#   2. TTN → HiveMQ    (Backend_Arduino/TTN_MQTT.py)
#   3. HiveMQ → Influx + Firebase (Backend_Arduino/MQTT_INFLUXDB_FIREBASE.py)
#   4. HiveMQ → AI API (Backend_Arduino/mqtt_to_ai_bridge.py)
#   5. Web Next.js     (paginaweb, puerto 3000)  [solo con -WithWeb]
#
# Requiere:
#   - Docker Desktop corriendo (para InfluxDB local)
#   - Dependencias instaladas (pip install -r requirements.txt / npm install)
#   - Backend_Arduino/.env completo (TTN + HiveMQ + Influx)
# =============================================================================

param(
    [switch]$WithWeb,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$backendDir = Join-Path $root "Backend_Arduino"
$aiDir = Join-Path $root "Inteligencia_Artificial"
$webDir = Join-Path $root "paginaweb"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " AGRILION - Arranque de servicios" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " Repo: $root"
Write-Host ""

# ─── 0. Chequeo de entorno ───────────────────────────────────────────────────
$checkEnv = Join-Path $root "scripts\check_env.py"
if (Test-Path -LiteralPath $checkEnv) {
    Write-Host "[0/5] Verificando .env..." -ForegroundColor Yellow
    python $checkEnv
}

# ─── 1. InfluxDB (Docker) ────────────────────────────────────────────────────
if (-not $SkipDocker) {
    Write-Host "[1/5] Levantando InfluxDB 3 Core (Docker)..." -ForegroundColor Yellow
    Push-Location $root
    try {
        docker compose up -d influxdb influxdb-ui | Out-Null
        Write-Host "      InfluxDB: http://localhost:8181  |  UI: http://localhost:8888" -ForegroundColor Green
    }
    catch {
        Write-Host "      ATENCION: Docker no respondio. Iniciar Docker Desktop." -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

function Start-AgrilionWindow {
    param(
        [string]$Title,
        [string]$WorkDir,
        [string]$Command
    )
    $inner = "`$host.ui.RawUI.WindowTitle='$Title'; Set-Location -LiteralPath '$WorkDir'; $Command"
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $inner | Out-Null
    Write-Host "      Ventana abierta: $Title" -ForegroundColor Green
}

# ─── 2. AI API ───────────────────────────────────────────────────────────────
Write-Host "[2/5] Iniciando AI API (puerto 8000)..." -ForegroundColor Yellow
Start-AgrilionWindow -Title "AGRILION - AI API (8000)" -WorkDir $aiDir `
    -Command "python -m uvicorn api.app:app --port 8000"

# ─── 3-4. Bridges MQTT ───────────────────────────────────────────────────────
Write-Host "[3/5] Iniciando bridges MQTT..." -ForegroundColor Yellow
Start-AgrilionWindow -Title "AGRILION - TTN -> HiveMQ" -WorkDir $backendDir `
    -Command "python TTN_MQTT.py"

Start-AgrilionWindow -Title "AGRILION - HiveMQ -> Influx/Firebase" -WorkDir $backendDir `
    -Command "python MQTT_INFLUXDB_FIREBASE.py"

Start-AgrilionWindow -Title "AGRILION - HiveMQ -> AI API" -WorkDir $backendDir `
    -Command "python mqtt_to_ai_bridge.py"

# ─── 5. Web (opcional) ───────────────────────────────────────────────────────
if ($WithWeb) {
    Write-Host "[4/5] Iniciando web Next.js (puerto 3000)..." -ForegroundColor Yellow
    Start-AgrilionWindow -Title "AGRILION - Web (3000)" -WorkDir $webDir `
        -Command "& npm.cmd run dev"
}
else {
    Write-Host "[4/5] Web: no iniciada (usar -WithWeb para levantarla)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[5/5] Listo." -ForegroundColor Cyan
Write-Host "      Health API:  http://localhost:8000/api/v1/health"
Write-Host "      Dashboard:   http://localhost:3000/dashboard"
Write-Host "      Influx UI:   http://localhost:8888"
Write-Host ""
Write-Host "Para detener: cerrar cada ventana abierta (y 'docker compose stop' si querés apagar InfluxDB)." -ForegroundColor DarkGray
