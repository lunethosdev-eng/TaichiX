# TaichiX

**TaichiX** — Crea y gestiona servidores de Minecraft **Java** y **Bedrock** en tu Android.  
Todo dentro de la app. Sin Termux ni otras aplicaciones.

## Características

- Servidores **Java Edition** y **Bedrock**
- Ejecución en el propio dispositivo (usa la RAM que asignes)
- **Túnel público automático** → tus amigos entran desde **cualquier internet**
- Detección de RAM + advertencia si es baja
- Consola de logs
- Invitación lista para copiar y compartir
- APK generado con GitHub Actions

## Cómo funciona (visión del producto)

1. Creas el servidor en TaichiX (tipo, versión, RAM, jugadores…).
2. Pulsas **Iniciar**.
3. TaichiX descarga los archivos del servidor, lo ejecuta y abre el túnel público.
4. Compartes la dirección pública. Tus amigos se conectan desde cualquier red.

No hace falta instalar nada más.

## Stack

- React + Vite + TypeScript + Tailwind
- Capacitor (Android)
- Plugin nativo `ServerNative` (Java/Kotlin) para procesos, descarga y túnel
- GitHub Actions → APK

## Desarrollo

```bash
npm install
npm run dev
```

## Generar APK

### Automático
1. Sube el repo a GitHub  
2. Actions → **Build Android APK**  
3. Descarga el artefacto

### Manual
```bash
npm run build
npx cap add android
# Copia:
#   android-plugin/src/main/java/com/taichix/app/plugins/ServerNativePlugin.java
# a la ruta del paquete en android/app/src/main/java/...
npx cap sync
npx cap open android
```

## Estructura

```
src/plugins/ServerNative.ts           → API del plugin
src/plugins/ServerNative.web.ts       → fallback (navegador)
android-plugin/.../ServerNativePlugin.java → nativo Android
```

## Notas técnicas

- El plugin nativo descarga Paper (Java) o PocketMine (Bedrock) y el agente de túnel.
- Para ser 100 % autónomo en todos los dispositivos, el APK debe incluir (o descargar en el primer uso) un **runtime embebido** (JRE mínimo / PHP) y el binario del túnel según ABI.
- Android puede matar procesos en segundo plano: el plugin debe ejecutarse como **Foreground Service** con notificación persistente (siguiente mejora nativa).

## Nombre y IDs

| Campo    | Valor              |
|----------|--------------------|
| App name | TaichiX            |
| appId    | com.taichix.app    |
| Dominio túnel (ejemplo) | *.play.taichix.app |

---

TaichiX — servidores Minecraft en tu bolsillo, accesibles desde cualquier internet.
