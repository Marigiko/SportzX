:: solve_cf_windows.bat
:: Ejecutar en Windows para resolver CF challenge y capturar URLs
:: Requiere: Node.js con playwright instalado, o Python 3

@echo off
echo SportzX API URL Discovery - Windows Runner
echo ==========================================
echo.

:: Opcion 1: Usando Node.jsPlaywright (mas rapido)
where node >nul 2>&1
if %errorlevel%==0 (
    echo Usando Node.js Playwright...
    node solve_cf.js
    goto :done
)

:: Opcion 2: Usando Python Playwright
where python >nul 2>&1
if %errorlevel%==0 (
    echo Usando Python Playwright...
    python capture_api.py
    goto :done
)

echo ERROR: Necesitas Node.js o Python con playwright instalado
pause

:done
echo.
echo Revisa captured_urls.jsonl para las URLs encontradas
pause
