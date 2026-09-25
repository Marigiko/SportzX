@echo off
set AAPT2=C:\Users\mark2\AppData\Local\Android\Sdk\build-tools\35.0.0\aapt2.exe
%AAPT2% dump badging D:\Projects\SportzX\versions\LibreTV_capacitor_1.1.0.apk | findstr /i "package: launchable\|leanback\|versionName\|permission\|application-label"
