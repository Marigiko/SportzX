#!/bin/bash
# Bluestacks ADB Interception Setup for WSL2
# Run this from WSL2 after opening Bluestacks on Windows

set -e
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
SCRIPT_DIR="/mnt/e/Projects/SportzX"

echo "================================================"
echo "  SportzX - Intercepción via Bluestacks (WSL2)"
echo "================================================"
echo ""
echo "PRE-REQ:"
echo "  1. Abre BlueStacks en Windows"
echo "  2. Ve aSettings > Advanced > Activa 'Android Debug Bridge (ADB)'"
echo ""

# 1. Configurar port-forwarding (requiere admin en Windows)
echo "=== Paso 1: Configurar Port Forwarding ==="
echo "Necesitas ejecutar esto en Windows PowerShell (Admin):"
echo ""
echo '  netsh interface portproxy add v4tov4 listenport=5555 listenaddress=0.0.0.0 connectport=5555 connectaddress=127.0.0.1'
echo ""
echo "Luego abre el puerto en el firewall de Windows:"
echo ''
echo '  netsh advfirewall firewall add rule name="Bluestacks ADB" dir=in action=allow protocol=TCP localport=5555'
echo ""
echo "Alternativa manual:"
echo "  1. Abre PowerShell como Administrador"
echo "  2. Ejecuta los dos comandos de arriba"
echo ""
read -p "Presiona Enter cuando hayas hecho esto..." dummy

# 2. Obtener IP de Windows
WINDOWS_IP=$(ip route | grep default | awk '{print $3}' | head -1)
echo "IP de Windows para WSL2: $WINDOWS_IP"

# 3. Conectar ADB
echo "=== Paso 2: Conectar ADB ==="
adb kill-server
sleep 1
adb start-server
sleep 2
adb connect ${WINDOWS_IP}:5555
sleep 2

DEVICES=$(adb devices | grep -v List | grep -v "^$" | wc -l)
if [ "$DEVICES" -gt 0 ]; then
    echo "✓ Bluestacks conectado!"
    adb devices -l
else
    echo "✗ No se pudo conectar. Intentando localhost..."
    adb connect localhost:5555
    adb devices -l
fi

# 4. Instalar APK
echo ""
echo "=== Paso 3: Instalar APK ==="
APK="$SCRIPT_DIR/SportzX_v2.5(1).apk"
if ! adb shell pm list packages 2>/dev/null | grep -q com.sportzx.live; then
    echo "Instalando..."
    adb install -r "$APK"
else
    echo "APK ya instalada"
fi

# 5. Iniciar MITM proxy
echo ""
echo "=== Paso 4: Captura de tráfico ==="
echo "En OTRA terminal WSL2, ejecuta:"
echo ""
echo "  mitmdump -s $SCRIPT_DIR/capture_urls.py -p 8080"
echo ""
echo "Luego configura el proxy en BlueStacks:"
echo "  Settings > Wi-Fi > Proxy: Manual"
echo "  Hostname: $WINDOWS_IP  |  Port: 8080"
echo ""
echo "Después ABRE la app SportzX y las URLs aparecerán:"
echo "  $SCRIPT_DIR/captured_urls.jsonl"
echo ""
echo "=== Paso 5: iniciar app ==="
adb shell am start -n com.sportzx.live/.activities.SplashActivity 2>/dev/null || true
echo "App iniciada. Revisa mitmproxy para ver las URLs."