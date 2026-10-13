# AGRILION - Flasheo del firmware CubeCell con las opciones correctas.
#
# Uso:
#   .\scripts\flash_firmware.ps1                 # compila y sube a COM4
#   .\scripts\flash_firmware.ps1 -Port COM5
#   .\scripts\flash_firmware.ps1 -CompileOnly    # solo compilar
#
# IMPORTANTE: el default del core CubeCell es AS923; si no se pasa
# LORAWAN_REGION=2 (AU915) la placa "no transmite". Este script lo fija.

param(
    [string]$Port = "COM4",
    [switch]$CompileOnly
)

$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
$sketch = Join-Path $root "Backend_Arduino\Codigo_TransmisionLoraWAN_Sensores"

$cli = "C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe"
if (-not (Test-Path -LiteralPath $cli)) {
    $cli = "$env:LOCALAPPDATA\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe"
}
if (-not (Test-Path -LiteralPath $cli)) {
    Write-Error "No se encontro arduino-cli. Ajustar la ruta en este script."
}

# LORAWAN_REGION=2   -> AU915 (default del core = AS923, no transmite en AU)
# LORAWAN_RGB=0      -> la libreria NO toca Vext; el firmware lo controla solo
#                       (sensores encendidos solo durante la lectura)
# LORAWAN_DebugLevel=2 -> logs de radio/frecuencia por serie a 115200
$options = "LORAWAN_REGION=2,LORAWAN_RGB=0,LORAWAN_DebugLevel=2"
$fqbn = "CubeCell:CubeCell:CubeCell-GPS"

Write-Host "Flasheando $sketch"
Write-Host "  FQBN:    $fqbn"
Write-Host "  Options: $options"
if (-not $CompileOnly) { Write-Host "  Puerto:  $Port" }

if ($CompileOnly) {
    & $cli compile --fqbn $fqbn --board-options $options $sketch
} else {
    & $cli compile --upload -p $Port --fqbn $fqbn --board-options $options $sketch
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK" -ForegroundColor Green
} else {
    Write-Error "Fallo el flasheo (exit code $LASTEXITCODE)"
}
