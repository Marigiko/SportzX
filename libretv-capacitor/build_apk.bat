@echo off
setlocal EnableDelayedExpansion

:: Java and Android SDK paths (Windows)
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
set ANDROID_HOME=C:\Users\mark2\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%

echo === Building LibreTV Capacitor APK ===
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%

cd /d D:\Projects\SportzX\libretv-capacitor\android

echo.
echo === Running Gradle assembleDebug ===
call gradlew.bat assembleDebug 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo !!! BUILD FAILED with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo.
echo === BUILD SUCCESS ===

:: Copy APK to versions directory
set APK_PATH=app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo Copying APK to versions...
    copy /Y "%APK_PATH%" "D:\Projects\SportzX\versions\LibreTV_capacitor_1.1.0.apk"
    echo APK saved to: D:\Projects\SportzX\versions\LibreTV_capacitor_1.1.0.apk
) else (
    echo WARNING: APK not found at %APK_PATH%
)

echo.
echo === DONE ===
