#!/bin/bash
# SportzX Traffic Interception Setup
# Run this after: sudo chmod 666 /dev/kvm
#
# This script:
# 1. Starts mitmproxy to capture URLs
# 2. Starts the Android emulator
# 3. Installs the APK + mitmproxy CA cert
# 4. Routes traffic through mitmproxy
# 5. Runs Frida SSL bypass
# 6. Captures all API URLs

set -e
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin

APK="/mnt/e/Projects/SportzX/SportzX_v2.5(1).apk"
PROJECT="/mnt/e/Projects/SportzX"
MITM_PORT=8080

echo "=== Step 1: Starting mitmproxy ==="
# Start mitmproxy in background
mitmdump -s "$PROJECT/capture_urls.py" -p $MITM_PORT --set stream_large_bodies=1m > "$PROJECT/mitmproxy.log" 2>&1 &
MITM_PID=$!
echo "mitmproxy PID: $MITM_PID"
sleep 3

echo "=== Step 2: Starting emulator ==="
emulator -avd sportz_test -no-window -no-audio -no-snapshot -gpu swiftshader_indirect -no-boot-anim -port 5554 > "$PROJECT/emulator.log" 2>&1 &
echo "Emulator starting (wait ~60s)..."

adb wait-for-device
echo "Device connected, waiting for boot..."
timeout 180 adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done; echo BOOTED'
echo "Boot complete!"

echo "=== Step 3: Install mitmproxy CA certificate ==="
# Get mitmproxy CA cert
MITM_CA_DIR=~/.mitmproxy
MITM_CA="$MITM_CA_DIR/mitmproxy-ca-cert.pem"
if [ ! -f "$MITM_CA" ]; then
    echo "Waiting for CA cert generation..."
    sleep 5
fi
# Rename for Android (requires .crt extension)
cp "$MITM_CA" "$PROJECT/mitmproxy-ca.crt" 2>/dev/null || true

# Install on device
adb push "$PROJECT/mitmproxy-ca.crt" /sdcard/Download/mitmproxy-ca.crt 2>/dev/null || echo "Will install cert later"
# For system-level cert (requires root):
adb root 2>/dev/null || true
adb remount 2>/dev/null || true
# Install as user cert
adb install "$APK" 2>/dev/null || echo "APK may already be installed"

echo "=== Step 4: Configure proxy ==="
adb shell settings put global http_proxy 10.0.2.2:$MITM_PORT
echo "Proxy set to 10.0.2.2:$MITM_PORT"

echo "=== Step 5: Install Frida server && run bypass ==="
# Download frida server for the emulator
FRIDA_VERSION=$(frida --version)
echo "Frida version: $FRIDA_VERSION"

# Install frida-server on device
if ! adb shell pm list packages | grep -q frida.server; then
    echo "Installing frida-server..."
    # Use objection/frida-tools bundled or download
    FRIDA_ARCH=x86_64
    curl -L -o /tmp/frida-server.xz "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-server-${FRIDA_VERSION}-android-${FRIDA_ARCH}.xz"
    unxz /tmp/frida-server.xz
    adb push /tmp/frida-server /data/local/tmp/frida-server
    adb shell chmod 755 /data/local/tmp/frida-server
    adb shell /data/local/tmp/frida-server &
    sleep 2
fi

echo "=== Step 6: Launch app with Frida bypass ==="
# Start the app with SSL bypass
frida -U -f com.sportzx.live -l "$PROJECT/frida_ssl_bypass.js" --no-pause &
FRIDA_PID=$!
sleep 3

# Now start the actual app
adb shell am start -n com.sportzx.live/.activities.SplashActivity

echo ""
echo "=== INTERCEPTION ACTIVE ==="
echo "mitmproxy PID: $MITM_PID"
echo "Frida bypass running"
echo "URLs being captured to: $PROJECT/captured_urls.jsonl"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait and show captured URLs
trap "kill $MITM_PID 2>/dev/null; adb shell am force-stop com.sportzx.live; exit" INT TERM
while true; do
    if [ -f "$PROJECT/captured_urls.jsonl" ]; then
        echo "--- Recent URLs ---"
        tail -5 "$PROJECT/captured_urls.jsonl" | python3 -c "
import sys, json
for line in sys.stdin:
    d = json.loads(line.strip())
    print(f\"  {d['method']} {d['url']}\")
" 2>/dev/null
    fi
    sleep 10
done
