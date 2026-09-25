#!/bin/bash
# intercept_device.sh
# Captura tráfico de SportzX en un dispositivo Android REAL
# Requisitos: celular Android con depuración USB activa

set -e
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

APK="/mnt/e/Projects/SportzX/SportzX_v2.5(1).apk"
SCRIPT_DIR="/mnt/e/Projects/SportzX"

echo "============================================"
echo "  SportzX - Intercepción en dispositivo real"
echo "============================================"
echo ""
echo "PRE-REQ:"
echo "  1. Conecta tu Android por USB"
echo "  2. Activa 'Depuración USB' en Opciones de desarrollador"
echo "  3. Acepta la autorización ADB en el teléfono"
echo ""
echo "  Presiona Enter cuando esté listo..."
read

# Detectar dispositivo
adb wait-for-device
DEVICE=$(adb shell getprop ro.product.model 2>/dev/null)
echo "✓ Dispositivo: $DEVICE"

# Verificar root (necesario para bypasear SSL pinning en la app)
echo "Verificando root..."
if adb shell su -c "id" 2>/dev/null | grep -q uid=0; then
    echo "✓ Dispositivo con root - bypass SSL funcionará"
    HAS_ROOT=1
else
    echo "⚠ Sin root - intentaremos bypass sin root (puede fallar)"
    echo "  Alternativa: usar app parcheada con apk-mitm"
    HAS_ROOT=0
fi

# Instalar APK si no está
if ! adb shell pm list packages 2>/dev/null | grep -q com.sportzx.live; then
    echo "Instalando APK..."
    adb install -r "$APK"
fi

echo ""
echo "=== Configurar proxy ==="
# Obtener IP de esta máquina
PC_IP=$(ip route get 1 | awk '{print $7}' | head -1)
[ -z "$PC_IP" ] && PC_IP=$(hostname -I | awk '{print $1}')
echo "Tu IP: $PC_IP"
echo ""
echo "Configura el proxy en tu teléfono:"
echo "  - Wi-Fi → Red conectada → Modificar → Proxy: Manual"
echo "  - Hostname: $PC_IP"
echo "  - Puerto: 8080"
echo ""
echo "Luego presiona Enter..."
read

# Iniciar app
echo "Iniciando SportzX..."
adb shell am start -n com.sportzx.live/.activities.SplashActivity 2>/dev/null

echo ""
echo "=== Ahora ejecuta mitmproxy en OTRA terminal ==="
echo ""
echo "  mitmdump -s /mnt/e/Projects/SportzX/capture_urls.py -p 8080"
echo ""
echo "Las URLs se guardan en: captured_urls.jsonl"
echo ""
echo "Para instalar cert CA de mitmproxy en el teléfono:"
echo "  1. En PC: mitmproxy -p 8080 (luego Ctrl+C)"
echo "  2. Teléfono: visita http://mitm.it y descarga cert Android"
echo ""
echo "Para Frida SSL bypass (requiere frida-server en dispositivo):"
echo "  1. Descarga frida-server para tu arquitectura"
echo "  2. adb push frida-server /data/local/tmp/"
echo "  3. adb shell su -c '/data/local/tmp/frida-server &'"
echo "  4. frida -U -f com.sportzx.live -l /mnt/e/Projects/SportzX/frida_ssl_bypass.js"
