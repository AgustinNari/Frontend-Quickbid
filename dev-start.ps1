param(
    [switch]$SkipDevice,
    [switch]$WifiOnly
)

$BACKEND_DIR  = "$PSScriptRoot\BackendQuickbid\quickbid"
$FRONTEND_DIR = "$PSScriptRoot\FrontendQuickbid"
$BACKEND_PORT = 8080
$METRO_PORT   = 8081

$adbCandidates = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe",
    "C:\Android\Sdk\platform-tools\adb.exe",
    "D:\Android\Sdk\platform-tools\adb.exe",
    "E:\Android\Sdk\platform-tools\adb.exe"
)
$ADB = $adbCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $ADB) {
    $inPath = Get-Command adb -ErrorAction SilentlyContinue
    if ($inPath) { $ADB = $inPath.Source }
}

function Write-Step($msg) {
    Write-Host ""
    Write-Host "  >> $msg" -ForegroundColor Cyan
}

function Write-OK($msg) {
    Write-Host "     [OK] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "     [!]  $msg" -ForegroundColor Yellow
}

function Wait-Port($port, $timeoutSec = 30) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSec) {
        try {
            $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
            if ($conn.TcpTestSucceeded) { return $true }
        } catch {}
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "     esperando puerto $port..." -ForegroundColor DarkGray
    }
    return $false
}

Write-Step "Limpiando procesos previos..."

$backendPid = (Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($backendPid) {
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    Write-Warn "Proceso anterior en puerto $BACKEND_PORT terminado (PID $backendPid)"
}

$metroPid = (Get-NetTCPConnection -LocalPort $METRO_PORT -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($metroPid) {
    Stop-Process -Id $metroPid -Force -ErrorAction SilentlyContinue
    Write-Warn "Proceso anterior en puerto $METRO_PORT terminado (PID $metroPid)"
}

Write-Step "Verificando regla de firewall para puerto $BACKEND_PORT..."

$fwRule = Get-NetFirewallRule -DisplayName "QuickBid-$BACKEND_PORT" -ErrorAction SilentlyContinue
if (-not $fwRule) {
    try {
        New-NetFirewallRule -DisplayName "QuickBid-$BACKEND_PORT" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $BACKEND_PORT | Out-Null
        Write-OK "Regla de firewall creada"
    } catch {
        Write-Warn "No se pudo crear la regla de firewall. Ejecutá el script como Administrador si hay problemas de conexión."
    }
} else {
    Write-OK "Regla de firewall ya existe"
}

Write-Step "Levantando backend Spring Boot..."

$backendLog = "$env:TEMP\quickbid-backend.log"
$psExeForBackend = (Get-Process -Id $PID).MainModule.FileName
Start-Process $psExeForBackend -ArgumentList "-NoExit", "-Command", "Set-Location '$BACKEND_DIR'; .\mvnw.cmd spring-boot:run *> '$backendLog'; Read-Host 'Press Enter to close'"  -WindowStyle Minimized

Write-Host "     Esperando que el backend arranque (hasta 60s)..." -ForegroundColor DarkGray

$ready = Wait-Port -port $BACKEND_PORT -timeoutSec 60
if ($ready) {
    Write-OK "Backend corriendo en http://localhost:$BACKEND_PORT"
    Write-OK "H2 Console: http://localhost:$BACKEND_PORT/h2-console"
} else {
    Write-Host ""
    Write-Host "  [ERROR] El backend no arrancó. Revisar log en: $backendLog" -ForegroundColor Red
    Write-Host "  Últimas líneas del log:" -ForegroundColor Red
    Get-Content $backendLog -Tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    exit 1
}

$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1).IPAddress
if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." } | Select-Object -First 1).IPAddress
}

Write-OK "IP local: $localIP"

$configFile = "$FRONTEND_DIR\src\api\config.ts"
if ($WifiOnly) {
    $configContent = @"
/**
 * URL base del backend.
 * Modo WiFi — el celu debe estar en la misma red que la PC.
 * IP de la PC: $localIP
 */
export const BASE_URL = 'http://$($localIP):$BACKEND_PORT';
"@
    Set-Content -Path $configFile -Value $configContent -Encoding UTF8
    Write-OK "config.ts actualizado con IP $localIP (modo WiFi)"
} else {
    $configContent = @"
/**
 * URL base del backend.
 * Modo USB con adb reverse — localhost tuneliza al backend de la PC.
 * Sin cable o sin adb: cambiar a 'http://$($localIP):$BACKEND_PORT'
 */
export const BASE_URL = 'http://localhost:$BACKEND_PORT';
"@
    Set-Content -Path $configFile -Value $configContent -Encoding UTF8
    Write-OK "config.ts configurado para ADB reverse (localhost)"
}

if (-not $SkipDevice -and -not $WifiOnly) {
    Write-Step "Conectando celular via ADB..."

    if (-not $ADB) {
        Write-Warn "ADB no encontrado. Opciones:"
        Write-Warn "  1. Instalá Android Studio (incluye SDK + ADB)"
        Write-Warn "  2. Agregá platform-tools al PATH del sistema"
        Write-Warn "  3. Usá el flag -SkipDevice para omitir el celu"
    } else {
        $devices = & $ADB devices 2>&1 | Select-String "device$"
        if ($devices) {
            & $ADB reverse tcp:$METRO_PORT tcp:$METRO_PORT | Out-Null
            & $ADB reverse tcp:$BACKEND_PORT tcp:$BACKEND_PORT | Out-Null
            Write-OK "ADB reverse configurado (puertos $BACKEND_PORT y $METRO_PORT)"

            & $ADB shell am start -n com.frontendquickbid/.MainActivity | Out-Null
            Write-OK "App lanzada en el celu"
        } else {
            Write-Warn "No hay celu conectado por USB. Conectá el dispositivo y activá USB Debugging."
            Write-Warn "O usá el flag -WifiOnly para conectarte por red WiFi."
        }
    }
}

Write-Step "Levantando Metro bundler..."

$metroLog = "$env:TEMP\quickbid-metro.log"

$psExe = (Get-Process -Id $PID).MainModule.FileName
Start-Process $psExe -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND_DIR'; npx react-native start --reset-cache 2>&1 | Tee-Object -FilePath '$metroLog'"

Start-Sleep -Seconds 3
Write-OK "Metro iniciado (puerto $METRO_PORT) — ventana separada abierta"

Write-Host ""
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host "  |           QuickBid — Dev Environment Ready           |" -ForegroundColor Green
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host "  |  Backend:   http://localhost:$BACKEND_PORT                   |" -ForegroundColor Green
Write-Host "  |  H2 Console: http://localhost:$BACKEND_PORT/h2-console       |" -ForegroundColor Green
Write-Host "  |  Metro:     http://localhost:$METRO_PORT                     |" -ForegroundColor Green
Write-Host "  |  IP local:  $localIP                           |" -ForegroundColor Green
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host "  |  Usuarios de prueba:                                 |" -ForegroundColor Green
Write-Host "  |    juan@quickbid.com   / password123                 |" -ForegroundColor Green
Write-Host "  |    maria@quickbid.com  / password123                 |" -ForegroundColor Green
Write-Host "  |    carlos@quickbid.com / password123                 |" -ForegroundColor Green
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host "  |  Tokens de verificación (registro/recuperación):     |" -ForegroundColor Green
Write-Host "  |    Get-Content $env:TEMP\quickbid-backend.log |      |" -ForegroundColor Green
Write-Host "  |    Select-String '[DEV] Token'                       |" -ForegroundColor Green
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host ""

Write-Host "  Logs:" -ForegroundColor DarkGray
Write-Host "    Backend -> $backendLog" -ForegroundColor DarkGray
Write-Host "    Metro   -> $metroLog" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Para ver tokens en tiempo real:" -ForegroundColor DarkGray
$tokenCmd = "    Get-Content $backendLog -Wait | Select-String " + [char]39 + "[DEV] Token" + [char]39
Write-Host $tokenCmd -ForegroundColor DarkGray
Write-Host ""
