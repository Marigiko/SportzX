#!/usr/bin/env python3
"""
SportzX API Capture Script
===========================
Descubre la URL real del API haciendo bypass de Cloudflare JS Challenge.

Requisitos:
  - Proton VPN activo (para rotar IP y evitar rate limits)
  - Python 3.10+ con playwright + curl_cffi
  - Navegador real (Chrome/Chromium) disponible

Uso:
  1. Conectar Proton VPN a cualquier servidor
  2. Ejecutar: python3 capture_api.py
  3. Las URLs capturadas se guardan en captured_urls.jsonl

El script:
  - Resuelve Cloudflare JS Challenge navegando con browser real
  - Captura TODOS los requests a endpoints JSON
  - Detecta automáticamente la URL base del API
  - Guarda en captured_urls.jsonl
"""
import asyncio
from playwright.async_api import async_playwright
import json
from datetime import datetime
import subprocess
import time
import sys

CAPTURE_FILE = "captured_urls.jsonl"
CF_COOKIES_FILE = "cf_cookies.json"


def check_ip():
    """Get current public IP via multiple services."""
    services = [
        "https://api.ipify.org",
        "https://ifconfig.me/ip",
        "https://icanhazip.com"
    ]
    for url in services:
        try:
            result = subprocess.run(
                ["curl", "-s", "--max-time", "5", url],
                capture_output=True, text=True, timeout=10
            )
            ip = result.stdout.strip()
            if ip and "." in ip:
                return ip
        except Exception:
            pass
    return "unknown"


def rotate_vpn():
    """Instrucciones para rotar VPN."""
    return """
    ╔══════════════════════════════════════════════════════════════╗
    ║  IP BLOQUEADA - Acción requerida:                          ║
    ║                                                              ║
    ║  1. Abre Proton VPN en Windows                              ║
    ║  2.Cambia a OTRO servidor (diferente país)                 ║
    ║  3. Espera 5 segundos                                       ║
    ║  4. Vuelve a ejecutar este script                          ║
    ║                                                              ║
    ║  IPs probadas:                                              ║
    """


async def wait_for_cf_challenge(page, timeout=30):
    """Wait for Cloudflare JS challenge to resolve."""
    print("Esperando resolución de Cloudflare JS Challenge...")
    for i in range(timeout // 2):
        await page.wait_for_timeout(2000)
        title = await page.title()
        if title and "just a moment" not in title.lower():
            print(f"  ✓ Challenge resuelto (title: {title})")
            return True
    return False


async def solve_cf_with_chrome():
    """Use Windows Chrome (with display) to solve CF."""
    import os
    
    WINDOWS_IP = "172.20.192.1"  # Ajustar según WSL2 gateway
    CDP_PORT = 9222
    
    # Start Chrome on Windows with debugging
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    
    chrome_path = None
    for p in chrome_paths:
        if os.path.exists(p.replace("\\", "/").replace("C:", "/mnt/c")):
            chrome_path = p
            break
    
    if not chrome_path:
        print("Chrome no encontrado en Windows")
        return None
    
    # Start Chrome with CDP
    cmd = f'start "" "{chrome_path}" --remote-debugging-port={CDP_PORT} --disable-gpu --no-sandbox'
    subprocess.Popen(cmd, shell=True)
    time.sleep(5)
    
    # Connect via Playwright
    browser = await p.chromium.connect_over_cdp(f"http://{WINDOWS_IP}:{CDP_PORT}")
    return browser


async def main():
    print("=" * 60)
    print("  SportzX API Capture")
    print("=" * 60)
    
    # Detect current IP
    current_ip = check_ip()
    print(f"\nIP actual: {current_ip}")
    print(f"Hora: {datetime.now().isoformat()}")
    
    CF_TARGETS = [
        "https://sportzx.com/api/events",
        "https://sportzx.com/events.json",
        "https://sportzx.com/eventCats.json",
        "https://sportzx.com/api/v1/events",
        "https://sportzx.com/api/categories",
        "https://sportzx.com/api/channels/soccer.json",
    ]
    
    async with async_playwright() as p:
        # Try headless first
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Step 1: Solve CF on main page
        print("\n[1/3] Resolviendo Cloudflare challenge...")
        try:
            await page.goto("https://sportzx.com", wait_until="commit", timeout=25000)
        except Exception:
            pass
        
        cf_solved = await wait_for_cf_challenge(page, timeout=20)
        
        if not cf_solved:
            print("  ✗ Headless no resolvió el challenge")
            print("  → Usando browser completo de Windows...")
            await browser.close()
            
            try:
                browser = await solve_cf_with_chrome()
                if browser:
                    context = browser.contexts[0]
                    page = await context.new_page()
                    await page.goto("https://sportzx.com", wait_until="networkidle", timeout=30000)
                    await page.wait_for_timeout(8000)
                else:
                    print("  ✗ No se pudo usar Chrome de Windows")
                    return
            except Exception as e:
                print(f"  ✗ Error: {e}")
                return
        
        # Step 2: Extract cookies
        cookies = await context.cookies()
        cookie_dict = {c['name']: c['value'] for c in cookies}
        
        with open(CF_COOKIES_FILE, "w") as f:
            json.dump(cookie_dict, f, indent=2)
        
        print(f"\n[2/3] Cookies obtenidas: {list(cookie_dict.keys())}")
        
        # Step 3: Try API endpoints
        print("\n[3/3] Probando endpoints...")
        results = {}
        
        for url in CF_TARGETS:
            try:
                resp = await page.goto(url, wait_until="commit", timeout=15000)
                body = await resp.body()
                text = body.decode('utf-8', errors='replace')
                
                if "Too many" in text:
                    print(f"  ✗ {url} → RATE LIMITED")
                    results[url] = {"status": 429, "rate_limited": True}
                elif "challenge" in text.lower() or "loading" in text.lower():
                    print(f"  ✗ {url} → CF Challenge")
                    results[url] = {"status": 200, "challenged": True}
                elif len(text) > 50:
                    print(f"  ✓ {url} → {len(text)} bytes")
                    results[url] = {"status": 200, "size": len(text), "preview": text[:200]}
                    
                    # Save successful response
                    fname = url.split("/")[-1].replace(".json", "") + "_captured.json"
                    with open(fname, "w") as f:
                        f.write(text)
                    print(f"    Guardado en {fname}")
                else:
                    print(f"  ? {url} → {len(text)} bytes")
                    results[url] = {"status": resp.status if resp else 0, "size": len(text)}
            except Exception as e:
                print(f"  ✗ {url} → Error: {e}")
                results[url] = {"error": str(e)}
            
            await asyncio.sleep(2)  # Delay para evitar rate limit
        
        await browser.close()
    
    # Summary
    print("\n" + "=" * 60)
    print("  RESUMEN")
    print("=" * 60)
    
    success = [u for u, r in results.items() if r.get("size", 0) > 50]
    rate_limited = [u for u, r in results.items() if r.get("rate_limited")]
    challenged = [u for u, r in results.items() if r.get("challenged")]
    
    if success:
        print(f"\n✓ Endpoints con datos: {len(success)}")
        for u in success:
            print(f"  {u}")
    if rate_limited:
        print(f"\n✗ Rate limited: {len(rate_limited)}")
        print("  → Cambiar servidor de Proton VPN y reintentar")
    if challenged:
        print(f"\n✗ CF Challenge activo: {len(challenged)}")
        print("  → Usar browser completo de Windows (Chrome)")
    
    print(f"\nPróximo paso: ejecutar con IP diferente si hay rate limit")


if __name__ == "__main__":
    asyncio.run(main())
