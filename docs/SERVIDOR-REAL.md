# TaichiX — Servidor real sin otras apps

TaichiX está diseñada para **no depender de Termux ni de ninguna otra aplicación**.

## Flujo objetivo (todo dentro de TaichiX)

1. El usuario crea el servidor en la UI.
2. Al iniciar:
   - Se asegura el **runtime embebido** (Java para Edition Java, PHP para PocketMine/Bedrock) en el almacenamiento privado de la app.
   - Se descarga Paper o PocketMine si no están.
   - Se lanza el proceso del servidor con la RAM elegida.
   - Se lanza el **agente de túnel** (playit u otro) embebido/descargado.
   - Se muestra la dirección pública al usuario.
3. Todo corre como servicio en primer plano (Foreground Service) para que Android no lo mate fácilmente.

## Plugin nativo (`ServerNative`)

Responsabilidades:

- `getMemoryInfo` — RAM real
- `downloadServer` — Paper / PocketMine
- `startServer` / `stopServer` — proceso del servidor
- `readConsole` — logs en vivo
- `startTunnel` / `stopTunnel` — acceso desde cualquier internet

Rutas internas (ejemplo):

```
/data/data/com.taichix.app/files/
  runtime/java     ← JRE embebido o descargado
  runtime/php      ← PHP embebido o descargado
  playit           ← agente de túnel
  servers/<id>/    ← mundo + jar/phar de cada servidor
```

## Primer uso del túnel

La primera vez el agente de túnel puede requerir un “claim” (abrir un enlace una vez).  
TaichiX puede abrir ese enlace con un Custom Tab / WebView y guardar el token para no volver a pedirlo.

## Limitaciones de Android (a tener en cuenta al terminar el nativo)

- Procesos largos → **Foreground Service** + notificación “Servidor TaichiX en ejecución”.
- Optimización de batería → pedir exclusión de optimización para TaichiX.
- Tamaño del APK → el runtime se puede descargar en el primer inicio en lugar de ir dentro del APK.

## Resumen para el usuario final

Instalas **solo TaichiX** → creas servidor → Iniciar → copias la dirección pública → tus amigos entran desde cualquier internet.

