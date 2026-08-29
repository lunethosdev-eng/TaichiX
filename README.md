# TaichiX 📱⛏️

> **Servidores de Minecraft en tu Android (Java y Bedrock). Accesibles desde cualquier internet.**

TaichiX convierte tu teléfono Android en un host de Minecraft sin depender de Termux, PCs ni servicios de pago. Creas el servidor, lo inicias y compartes una dirección pública. Tus amigos entran desde su red, no solo desde la tuya.

---

## 💡 La idea

Minecraft en el móvil suele limitarse a jugar. **TaichiX** está pensado para hospedar:

- 🟢 **Mundo Java o Bedrock** corriendo directamente en el propio dispositivo.
- ⚡ **RAM asignada por ti** según el rendimiento de tu teléfono.
- 🌐 **Túnel público automático** para conexión externa.
- 💻 **Consola y gestión** integradas en la misma aplicación.

> **Sin instalar aplicaciones adicionales.** Sin configuraciones avanzadas de red o forwarding manual.

---

## ✨ Características y Qué Puedes Hacer

| Función | Descripción |
| :--- | :--- |
| **Java Edition** | Servidores Paper (y loaders como Fabric según configuración). |
| **Bedrock** | PocketMine-MP corriendo en el propio dispositivo. |
| **Túnel público** | Dirección única para conectar desde cualquier internet. |
| **Control de RAM** | Eliges libremente cuánta memoria asignas al servidor. |
| **Consola en vivo** | Visualiza logs y output del proceso dentro de la app. |
| **Mods / Addons** | Selección al crear el servidor con catálogo y buscador integrado. |
| **Invitación rápida** | Texto e IP listos para copiar y compartir a tu grupo. |

---

## 🚀 Cómo se usa

1. **Instala** el APK de TaichiX.
2. **Crea un servidor** (elige el tipo, versión, RAM y número de jugadores).
3. **Pulsa Iniciar**.
4. **Copia la dirección pública** generada por el túnel.
5. **Compártela con tus amigos** y ¡a jugar!

> ℹ️ *La primera vez puede tardar un poco mientras descarga el runtime y los archivos base del servidor. Las siguientes ejecuciones serán mucho más rápidas.*

---

## 🎯 ¿Para quién es?

- **Grupos pequeños** que quieren un servidor propio sin pagar un hosting mensual.
- **Jugadores en Android** que buscan invitar a amigos sin estar conectados a la misma red Wi-Fi.
- **Amantes de la simplicidad** que prefieren una solución *all-in-one* en lugar de Termux + scripts + túneles a mano.

⚠️ **Requisito realista:** Se recomienda un dispositivo con suficiente memoria RAM. *Java Edition exige más recursos que Bedrock.* Si la RAM es escasa, la app te mostrará un aviso.

---

## 🔓 Open Source

TaichiX es **código abierto** y está pensado para toda la comunidad.

- 📖 Puedes ver el código, usarlo, estudiarlo y mejorarlo libremente.
- ⚙️ Los archivos APK se construyen de forma pública mediante **GitHub Actions**.
- 🚫 No existe una versión “cerrada” ni funciones bloqueadas tras un muro de pago.

*¿Quieres contribuir, reportar un fallo o sugerir una nueva función? ¡Siéntete libre de abrir una issue o enviarnos un Pull Request!*

---

## 📌 Estado del Proyecto

TaichiX está en **desarrollo activo**.

- [x] UI y flujo interactivo de creación de servidores.
- [x] Plugin nativo para gestión de procesos, descargas y túneles.
- [x] Builds automatizados de APK con GitHub Actions.
- [ ] *En desarrollo:* Mejoras en la estabilidad del arranque nativo.
- [ ] *En desarrollo:* Runtime Java automático simplificado.
- [ ] *En desarrollo:* Tienda/catálogo de mods con portadas reales.

> 📦 **Nota de instalación:** Descarga siempre el artefacto del último workflow exitoso. Se recomienda desinstalar la versión previa antes de actualizar.

---

## 📋 Identidad Técnica

| Campo | Valor |
| :--- | :--- |
| **Nombre** | TaichiX |
| **Package** | `com.taichix.app` |
| **Plataforma** | Android |
| **Licencia / Acceso** | Open Source (Libre para todos) |

---

<p align="center">
  <b>TaichiX</b> — <i>Tu servidor de Minecraft, en el bolsillo, abierto al mundo.</i> 🌍🎮
</p>
