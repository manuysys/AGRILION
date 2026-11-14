# Renueva el túnel rápido de Cloudflare y república el sitio + el APK.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\renew_tunnel.ps1 [-RebuildApk]
#
# Qué hace:
#   1. Mata el cloudflared viejo y abre un túnel nuevo hacia la API local (::1:8000).
#   2. Actualiza AI_API_URL (production) en el proyecto Vercel agrilion-live.
#   3. Redeploya la web (build remoto en Vercel).
#   4. Con -RebuildApk: recompila el APK con la URL nueva, lo copia a
#      paginaweb/public/Agrilion-demo.apk e imprime el SHA-256 (actualizá
#      docs/INSTALACION_APK.md con la URL y el hash nuevos).
#
# Requisitos:
#   - API corriendo en ::1:8000 (usar C:\Windows\Temp\opencode\agrilion_api_watchdog.ps1).
#   - Sesión de Vercel activa (vercel login) y el dir de deploy linkeado.
#   - cloudflared.exe en C:\Windows\Temp\opencode\cloudflared.exe.

param(
    [switch]$RebuildApk
)

$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $PSScriptRoot
$deployDir   = "C:\Windows\Temp\opencode\agrilion-deploy-live-v14"
$logsDir     = "C:\Windows\Temp\opencode\agrilion_logs"
$cloudflared = "C:\Windows\Temp\opencode\cloudflared.exe"
$date        = Get-Date -Format "yyyy-MM-dd"
$stamp       = Get-Date -Format "yyyyMMdd-HHmmss"

function Step($msg) { Write-Host "==> $msg" }

# ── 1. Túnel nuevo ────────────────────────────────────────────────────────────
Step "Cerrando cloudflared viejo"
Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Step "Abriendo túnel nuevo"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
Start-Process -FilePath $cloudflared `
    -ArgumentList "tunnel","--url","http://localhost:8000","--loglevel","info" `
    -RedirectStandardOutput "$logsDir\tunnel_$stamp.log" `
    -RedirectStandardError  "$logsDir\tunnel_err_$stamp.log" -WindowStyle Hidden

Start-Sleep -Seconds 14
$url = $null
foreach ($f in @("$logsDir\tunnel_err_$stamp.log", "$logsDir\tunnel_$stamp.log")) {
    $m = Select-String -Path $f -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue |
         Select-Object -First 1
    if ($m) { $url = $m.Matches[0].Value; break }
}
if (-not $url) {
    Write-Host "ERROR: no se pudo leer la URL del túnel. Revisá $logsDir\tunnel_err_$stamp.log" -ForegroundColor Red
    exit 1
}
Write-Host "TÚNEL NUEVO: $url"

$deadline = (Get-Date).AddSeconds(40)
$healthy = $false
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri "$url/api/v1/health" -UseBasicParsing -TimeoutSec 15
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 3 }
}
if (-not $healthy) {
    Write-Host "AVISO: el túnel responde pero la API no dio 200 todavía; continúo igual." -ForegroundColor Yellow
}

# ── 2. Env var en Vercel ─────────────────────────────────────────────────────
Step "Actualizando AI_API_URL en Vercel (production)"
Push-Location $deployDir
cmd /c "npx vercel env rm AI_API_URL production --confirm-name AI_API_URL" 2>&1 | Out-Null
cmd /c "echo $url| npx vercel env add AI_API_URL production" | Out-Null
Pop-Location
Write-Host "AI_API_URL actualizada."

# ── 3. (Opcional) APK con la URL nueva ───────────────────────────────────────
if ($RebuildApk) {
    Step "Recompilando APK con la URL nueva"
    Push-Location (Join-Path $projectRoot "AppCelular")
    & .\gradlew.bat assembleDebug "-PapiBaseUrl=$url/" --console=plain | Select-Object -Last 2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: gradle falló; no se actualiza el APK." -ForegroundColor Red
        Pop-Location
    } else {
        $apkSrc = Join-Path (Get-Location) "app\build\outputs\apk\debug\app-debug.apk"
        Copy-Item $apkSrc (Join-Path $projectRoot "paginaweb\public\Agrilion-demo.apk") -Force
        Copy-Item $apkSrc (Join-Path $deployDir "public\Agrilion-demo.apk") -Force
        $hash = (certutil -hashfile $apkSrc SHA256 | Select-Object -Index 1).ToString().Trim()
        Write-Host "APK 1.5 actualizado. SHA-256: $hash"
        Write-Host "Recordá actualizar URL y hash en docs\INSTALACION_APK.md."
        Pop-Location
    }
} else {
    Copy-Item (Join-Path $projectRoot "paginaweb\public\Agrilion-demo.apk") `
              (Join-Path $deployDir "public\Agrilion-demo.apk") -Force -ErrorAction SilentlyContinue
}

# ── 4. Redeploy web (build remoto) ───────────────────────────────────────────
Step "Redeploy de agrilion-live"
Push-Location $deployDir
cmd /c "npx vercel deploy --prod" 2>&1 | Select-String '"status"|"message"' | ForEach-Object { $_.Line.Trim() }
Pop-Location

Write-Host ""
Write-Host "Listo. Verificá https://agrilion-live.vercel.app y el health del túnel." -ForegroundColor Green
