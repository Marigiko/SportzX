# LibreTV webOS

Aplicación de TV deportiva para LG webOS.

## Instalación

```bash
npm install
```

## Build producción

```bash
npm run pack-p    # enact pack -p → genera dist/
ares-package dist -o ../versions/   # empaqueta IPK
```

## Instalar en TV

```bash
ares-setup-device
ares-novacom --device <nombre> --getkey
ares-install --device <nombre> com.libretv.webos_1.1.0_all.ipk
```
