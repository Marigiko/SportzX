## LibreTV v1.1.0 - Estado del Proyecto

### Plataformas
- **Android TV (Capacitor)**: `libretv-capacitor/` — Capacitor wrapper → APK nativa
  - APK: `versions/LibreTV_capacitor_1.1.0.apk` (4.5MB)
  - Package: com.libretv.app, versionCode=2, versionName=1.1.0
  - webDir: `libretv-webos/dist_trimmed/` (bundle limpio)
  - Compatible Android TV (leanback), tablet, y móvil
  - Funciona con D-pad (DPAD arrows, Enter, Back)
- **webOS TV**: `libretv-webos/` — App Enact 5.x + Limestone
  - IPK: `versions/com.libretv.webos_1.1.0_all.ipk` (15MB)
  - ID: com.libretv.webos, title: LibreTV
  - Fuente COMPLETO y funcional (recuperado del IPK)
  - Build: `npx enact pack -p && ares-package dist -o ../versions`
  - TV: prisoner@192.168.100.181:9922 (no usado actualmente)

### Renombrado SportzX → LibreTV (Completado)
- sportzx-capacitor/ → libretv-capacitor/ ✓
- sportzx-webos/ → libretv-webos/ ✓
- com.sportzx.app → com.libretv.app ✓
- Package Java migrado ✓
- MEMORY.md, build configs ✓
- NO renombrado: sportzx-android (histórico)

### Canales (v1.1.0)
- 13,196 canales totales en 181 categorias
- 558 nombres de canal limpios (User-Agent parser garbage eliminado)
- 15 canales UDP/multicast marcados [Dead]
- 1,548 con tag [Not 24/7]
- 716 con tag [Geo-blocked]

### Caracteristicas
- 83 paises con filtro
- Sidebar: categorias + filtro por pais
- Reproductor HLS con controles (auto-hide 5s)
- Subtitulos CC (tracks nativos HLS)
- 15s timeout para streams
- D-pad navigation: keycodes 19-22 (DPAD), 13/23 (Enter), 4/27/461/10009 (Back)
- TabIndex + focus outlines en sidebar y grid (navegación TV)

### Build Commands
- **webOS**: `cd libretv-webos && npx enact pack -p && ares-package dist -o ../versions`
- **Android**: `cmd.exe /c "D:\Projects\SportzX\libretv-capacitor\build_apk.bat"`
- Output: `versions/LibreTV_capacitor_1.1.0.apk`

### Notas
- `sportzx-webos-broken/` contiene el directorio corrupto del mv fallido (referencia histórica, borrable)
