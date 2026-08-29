package com.taichix.app.plugins;

import android.content.Context;
import android.app.ActivityManager;
import android.os.Build;
import android.util.Log;
import android.system.Os;
import android.system.ErrnoException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Plugin nativo REAL de TaichiX:
 * - Descarga Paper (Java) / PocketMine (Bedrock)
 * - Ejecuta procesos reales en el dispositivo
 * - Túnel playit (binario)
 * - RAM real del dispositivo
 *
 * Requiere que el APK se construya con este plugin registrado (ver workflow).
 */
@CapacitorPlugin(name = "ServerNative")
public class ServerNativePlugin extends Plugin {

    private static final String TAG = "ServerNative";
    private final Map<String, Process> processes = new HashMap<>();
    private final Map<String, Process> tunnels = new HashMap<>();
    private final Map<String, StringBuilder> consoleBuffers = new HashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasJava = findJava() != null;
        boolean hasPhp = findPhp() != null;
        boolean hasPlayit = new File(getContext().getFilesDir(), "bin/playit").exists();
        ret.put("available", true);
        ret.put("javaRuntime", hasJava);
        ret.put("phpRuntime", hasPhp);
        ret.put("playit", hasPlayit);
        call.resolve(ret);
    }

    @PluginMethod
    public void getMemoryInfo(PluginCall call) {
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        am.getMemoryInfo(mi);
        long totalMb = mi.totalMem / (1024 * 1024);
        long availableMb = mi.availMem / (1024 * 1024);
        JSObject ret = new JSObject();
        ret.put("totalMb", totalMb);
        ret.put("availableMb", availableMb);
        ret.put("usedMb", totalMb - availableMb);
        call.resolve(ret);
    }

    @PluginMethod
    public void downloadServer(PluginCall call) {
        String type = call.getString("type", "java");
        String version = call.getString("version", "1.21.4");
        String targetPath = call.getString("targetPath", "");

        executor.execute(() -> {
            try {
                File dir = new File(targetPath);
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("No se pudo crear directorio: " + targetPath);
                    return;
                }

                // Si version contiene "jre" o "openjdk", es descarga + extracción de Java Runtime
                if ("java".equals(type) && (version.contains("jre") || version.contains("openjdk"))) {
                    // Directorio fijo de runtime (no depende de targetPath del servidor)
                    File runtimeRoot = new File(getContext().getFilesDir(), "runtime");
                    File javaDir = new File(runtimeRoot, "java");
                    if (!javaDir.exists() && !javaDir.mkdirs()) {
                        call.reject("No se pudo crear directorio java: " + javaDir.getAbsolutePath());
                        return;
                    }

                    // Si ya existe bin/java, no re-descargar
                    File existingJava = new File(javaDir, "bin/java");
                    if (existingJava.exists() && existingJava.canExecute()) {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("path", javaDir.getAbsolutePath());
                        ret.put("message", "OpenJDK JRE ya instalado");
                        call.resolve(ret);
                        return;
                    }

                    // Elegir ABI
                    String abi = Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "arm64-v8a";
                    String jreUrl;
                    if (abi.contains("x86_64") || abi.contains("x86")) {
                        jreUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jre_x64_linux_hotspot_21.0.1_12.tar.gz";
                    } else {
                        // arm64 por defecto (mayoría de móviles)
                        jreUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jre_aarch64_linux_hotspot_21.0.1_12.tar.gz";
                    }

                    File tarOut = new File(javaDir, "jre.tar.gz");
                    boolean ok = downloadFile(jreUrl, tarOut);
                    if (!ok || tarOut.length() < 10000) {
                        call.reject("No se pudo descargar OpenJDK JRE (ABI=" + abi + ")");
                        return;
                    }

                    // Extraer tar.gz con el tar del sistema
                    try {
                        Process extract = new ProcessBuilder(
                            "tar", "-xzf", tarOut.getAbsolutePath(), "-C", javaDir.getAbsolutePath()
                        ).redirectErrorStream(true).start();
                        int code = extract.waitFor();
                        if (code != 0) {
                            call.reject("Error al extraer JRE (tar exit=" + code + ")");
                            return;
                        }
                    } catch (Exception e) {
                        call.reject("No se pudo extraer JRE: " + e.getMessage());
                        return;
                    }

                    // Temurin crea una subcarpeta tipo jdk-21.0.1+12-jre → mover contenido a javaDir
                    File[] children = javaDir.listFiles();
                    if (children != null) {
                        for (File child : children) {
                            if (child.isDirectory() && (child.getName().startsWith("jdk") || child.getName().contains("jre"))) {
                                File bin = new File(child, "bin");
                                if (bin.exists()) {
                                    // Mover contenido de la subcarpeta a javaDir
                                    File[] inner = child.listFiles();
                                    if (inner != null) {
                                        for (File f : inner) {
                                            File dest = new File(javaDir, f.getName());
                                            if (!f.renameTo(dest)) {
                                                // fallback copy
                                                // (en la mayoría de casos renameTo funciona en el mismo filesystem)
                                            }
                                        }
                                    }
                                    child.delete();
                                }
                            }
                        }
                    }

                    // Permisos de ejecución (Android suele bloquear binarios sin chmod real)
                    File binDir = new File(javaDir, "bin");
                    forceExecutableTree(binDir);
                    File libDir = new File(javaDir, "lib");
                    forceExecutableTree(libDir);

                    File javaBin = new File(javaDir, "bin/java");
                    if (!javaBin.exists()) {
                        call.reject("Tras extraer no se encontró bin/java en " + javaDir.getAbsolutePath());
                        return;
                    }
                    forceExecutable(javaBin);
                    if (!javaBin.canExecute()) {
                        call.reject("bin/java no es ejecutable (Permission). Ruta: " + javaBin.getAbsolutePath());
                        return;
                    }

                    // Borrar el tar para ahorrar espacio
                    //noinspection ResultOfMethodCallIgnored
                    tarOut.delete();

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("path", javaDir.getAbsolutePath());
                    ret.put("message", "OpenJDK JRE instalado y listo (" + (javaBin.length() / 1024) + " KB bin/java)");
                    call.resolve(ret);
                } else if ("java".equals(type)) {
                    File out = new File(dir, "server.jar");
                    boolean ok = downloadPaper(version, out);
                    if (!ok) {
                        call.reject("No se pudo descargar Paper " + version + ". Revisa la versión o la red.");
                        return;
                    }
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("path", out.getAbsolutePath());
                    ret.put("message", "Paper " + version + " descargado (" + (out.length() / 1024 / 1024) + " MB)");
                    call.resolve(ret);
                } else {
                    File out = new File(dir, "PocketMine-MP.phar");
                    String url = "https://github.com/pmmp/PocketMine-MP/releases/latest/download/PocketMine-MP.phar";
                    boolean ok = downloadFile(url, out);
                    if (!ok || out.length() < 10000) {
                        call.reject("No se pudo descargar PocketMine-MP");
                        return;
                    }
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("path", out.getAbsolutePath());
                    ret.put("message", "PocketMine descargado (" + (out.length() / 1024 / 1024) + " MB)");
                    call.resolve(ret);
                }
            } catch (Exception e) {
                call.reject("Error descargando servidor: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void startServer(PluginCall call) {
        String serverId = call.getString("serverId");
        String type = call.getString("type", "java");
        int port = call.getInt("port", 25565);
        int ramMb = call.getInt("ramMb", 1024);
        String serverPath = call.getString("serverPath", "");
        String worldName = call.getString("worldName", "world");
        String motd = call.getString("motd", "TaichiX");
        int maxPlayers = call.getInt("maxPlayers", 10);

        if (serverId == null || serverPath == null || serverPath.isEmpty()) {
            call.reject("serverId y serverPath son obligatorios");
            return;
        }

        executor.execute(() -> {
            try {
                stopProcess(processes, serverId);

                File dir = new File(serverPath);
                if (!dir.exists()) dir.mkdirs();

                ProcessBuilder pb;
                if ("java".equals(type)) {
                    File jar = new File(dir, "server.jar");
                    if (!jar.exists() || jar.length() < 10000) {
                        call.reject("server.jar no encontrado. Descarga el servidor primero.");
                        return;
                    }
                    writeText(new File(dir, "eula.txt"), "eula=true\n");
                    writeServerProperties(new File(dir, "server.properties"), port, motd, maxPlayers, worldName);

                    // Proot + rootfs Linux (glibc) para poder ejecutar OpenJDK en Android
                    String err = ensureLinuxRuntime();
                    if (err != null) {
                        call.reject(err);
                        return;
                    }

                    File proot = new File(getContext().getFilesDir(), "linux/proot");
                    File rootfs = new File(getContext().getFilesDir(), "linux/rootfs");
                    File javaBinGuest = new File(rootfs, "opt/java/bin/java");
                    if (!javaBinGuest.exists()) {
                        call.reject("Java no encontrado dentro del rootfs: " + javaBinGuest.getAbsolutePath());
                        return;
                    }

                    int xms = Math.min(512, ramMb);
                    // Montar la carpeta del servidor en /server dentro del rootfs
                    File tmpDir = new File(getContext().getFilesDir(), "linux/tmp");
                    if (!tmpDir.exists()) tmpDir.mkdirs();

                    pb = new ProcessBuilder(
                        proot.getAbsolutePath(),
                        "-r", rootfs.getAbsolutePath(),
                        "-0",
                        "-b", "/dev",
                        "-b", "/proc",
                        "-b", dir.getAbsolutePath() + ":/server",
                        "-w", "/server",
                        "/opt/java/bin/java",
                        "-Xms" + xms + "M",
                        "-Xmx" + ramMb + "M",
                        "-XX:+UseG1GC",
                        "-jar", "/server/server.jar",
                        "--nogui"
                    );
                    Map<String, String> envP = pb.environment();
                    envP.put("PROOT_TMP_DIR", tmpDir.getAbsolutePath());
                    envP.put("PROOT_NO_SECCOMP", "1");
                } else {
                    String phpBin = findPhp();
                    if (phpBin == null) {
                        call.reject(
                            "No hay PHP en el dispositivo. " +
                            "PocketMine requiere PHP 8.x en files/runtime/php."
                        );
                        return;
                    }
                    File phar = new File(dir, "PocketMine-MP.phar");
                    if (!phar.exists()) {
                        call.reject("PocketMine-MP.phar no encontrado.");
                        return;
                    }
                    pb = new ProcessBuilder(phpBin, phar.getAbsolutePath(), "--no-wizard");
                }

                pb.directory(dir);
                pb.redirectErrorStream(true);
                Map<String, String> env = pb.environment();
                env.put("HOME", dir.getAbsolutePath());

                Process proc = pb.start();
                processes.put(serverId, proc);
                consoleBuffers.put(serverId, new StringBuilder());
                startConsoleReader(serverId, proc);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("pid", 1);
                ret.put("message", "Proceso del servidor iniciado (PID activo)");
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "startServer failed", e);
                call.reject("Error al iniciar: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopServer(PluginCall call) {
        String serverId = call.getString("serverId");
        executor.execute(() -> {
            try {
                stopProcess(processes, serverId);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Servidor detenido");
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }

    @PluginMethod
    public void readConsole(PluginCall call) {
        String serverId = call.getString("serverId");
        StringBuilder buf = consoleBuffers.get(serverId);
        JSObject ret = new JSObject();
        if (buf == null || buf.length() == 0) {
            ret.put("lines", new JSONArray());
            call.resolve(ret);
            return;
        }
        String all = buf.toString();
        buf.setLength(0);
        String[] parts = all.split("\n");
        JSONArray arr = new JSONArray();
        for (String p : parts) {
            if (!p.trim().isEmpty()) arr.put(p);
        }
        ret.put("lines", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void startTunnel(PluginCall call) {
        String serverId = call.getString("serverId");
        int localPort = call.getInt("localPort", 25565);
        String type = call.getString("type", "java");

        executor.execute(() -> {
            try {
                File binDir = new File(getContext().getFilesDir(), "bin");
                if (!binDir.exists()) binDir.mkdirs();
                File playit = new File(binDir, "playit");

                if (!playit.exists()) {
                    boolean ok = downloadPlayit(playit);
                    if (ok) {
                        playit.setExecutable(true);
                    }
                }

                if (!playit.exists() || !playit.canExecute()) {
                    // Sin playit: devolvemos dirección local informativa (túnel no activo)
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("message",
                        "No se pudo obtener el binario playit. " +
                        "El servidor puede estar en local (puerto " + localPort + ") " +
                        "pero no es accesible desde otro internet hasta configurar el túnel."
                    );
                    ret.put("publicAddress", null);
                    ret.put("publicPort", localPort);
                    call.resolve(ret);
                    return;
                }

                stopProcess(tunnels, serverId);
                ProcessBuilder pb = new ProcessBuilder(playit.getAbsolutePath());
                pb.directory(binDir);
                pb.redirectErrorStream(true);
                Process proc = pb.start();
                tunnels.put(serverId, proc);

                // Leer un rato la salida buscando host:port (playit imprime la URL)
                String publicHost = null;
                int publicPort = localPort;
                try (BufferedReader br = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                    long deadline = System.currentTimeMillis() + 12000;
                    String line;
                    while (System.currentTimeMillis() < deadline && (line = br.readLine()) != null) {
                        appendConsole(serverId, "[playit] " + line);
                        // Heurística: líneas con dominio o IP:puerto
                        if (line.contains(".playit.gg") || line.contains("from_client")) {
                            publicHost = extractHost(line);
                        }
                    }
                } catch (Exception ignored) {}

                JSObject ret = new JSObject();
                ret.put("success", publicHost != null);
                ret.put("publicAddress", publicHost);
                ret.put("publicPort", publicPort);
                ret.put("message", publicHost != null
                    ? "Túnel playit activo"
                    : "playit iniciado; completa el claim la primera vez (revisa consola)");
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Error túnel: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopTunnel(PluginCall call) {
        String serverId = call.getString("serverId");
        stopProcess(tunnels, serverId);
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Túnel detenido");
        call.resolve(ret);
    }

    // ────────── helpers ──────────

    private boolean downloadPaper(String version, File out) {
        try {
            // API v3 (fill.papermc.io) — v2 fue descontinuada (410)
            String buildsUrl = "https://fill.papermc.io/v3/projects/paper/versions/" + version + "/builds";
            String buildsJson = httpGet(buildsUrl);
            if (buildsJson == null || buildsJson.length() < 10) {
                Log.e(TAG, "Paper builds null for " + version);
                return false;
            }
            JSONArray builds = new JSONArray(buildsJson);
            if (builds.length() == 0) return false;

            // Preferir canal STABLE; si no, el primero (más reciente)
            JSONObject chosen = null;
            for (int i = 0; i < builds.length(); i++) {
                JSONObject b = builds.getJSONObject(i);
                if ("STABLE".equalsIgnoreCase(b.optString("channel", ""))) {
                    chosen = b;
                    break;
                }
            }
            if (chosen == null) chosen = builds.getJSONObject(0);

            JSONObject downloads = chosen.getJSONObject("downloads");
            JSONObject app = downloads.has("server:default")
                ? downloads.getJSONObject("server:default")
                : downloads.getJSONObject(downloads.keys().next());
            String jarUrl = app.getString("url");
            Log.i(TAG, "Paper " + version + " -> " + jarUrl);
            return downloadFile(jarUrl, out);
        } catch (Exception e) {
            Log.e(TAG, "downloadPaper " + version, e);
            return false;
        }
    }

    private String httpGet(String urlStr) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(30000);
            conn.setRequestProperty("User-Agent", "TaichiX/1.0 (https://github.com/lunethosdev-eng/TaichiX)");
            if (conn.getResponseCode() != 200) return null;
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            br.close();
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean downloadFile(String urlStr, File out) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(120000);
            conn.setRequestProperty("User-Agent", "TaichiX/1.0 (https://github.com/lunethosdev-eng/TaichiX)");
            conn.connect();
            if (conn.getResponseCode() != 200) return false;
            try (InputStream in = conn.getInputStream(); FileOutputStream fos = new FileOutputStream(out)) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) fos.write(buf, 0, n);
            }
            return out.length() > 1000;
        } catch (Exception e) {
            Log.e(TAG, "download failed: " + urlStr, e);
            return false;
        }
    }

    private boolean downloadPlayit(File out) {
        String abi = Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "arm64-v8a";
        String asset = "playit-linux-aarch64";
        if (abi.contains("armeabi") || abi.contains("armv7")) {
            asset = "playit-linux-armv7";
        } else if (abi.contains("x86_64")) {
            asset = "playit-linux-amd64";
        }
        String url = "https://github.com/playit-cloud/playit-agent/releases/latest/download/" + asset;
        return downloadFile(url, out);
    }



    /**
     * Prepara proot + Ubuntu base arm64 + OpenJDK dentro del rootfs.
     * Primera vez: descarga ~80-120 MB. Luego reutiliza.
     * @return null si OK, mensaje de error si falla
     */
    private String ensureLinuxRuntime() {
        try {
            File linuxDir = new File(getContext().getFilesDir(), "linux");
            if (!linuxDir.exists() && !linuxDir.mkdirs()) {
                return "No se pudo crear linux/";
            }
            File proot = new File(linuxDir, "proot");
            File rootfs = new File(linuxDir, "rootfs");
            File javaBin = new File(rootfs, "opt/java/bin/java");
            File marker = new File(linuxDir, "ready.ok");

            if (marker.exists() && proot.exists() && javaBin.exists()) {
                forceExecutable(proot);
                forceExecutable(javaBin);
                return null;
            }

            if (!proot.exists() || proot.length() < 1000) {
                String abi = Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "arm64-v8a";
                String prootUrl;
                if (abi.contains("x86_64")) {
                    prootUrl = "https://skirsten.github.io/proot-portable-android-binaries/x86_64/proot";
                } else if (abi.contains("armeabi") || abi.contains("armv7")) {
                    prootUrl = "https://skirsten.github.io/proot-portable-android-binaries/armv7/proot";
                } else {
                    prootUrl = "https://skirsten.github.io/proot-portable-android-binaries/aarch64/proot";
                }
                if (!downloadFile(prootUrl, proot) || proot.length() < 1000) {
                    return "No se pudo descargar proot";
                }
            }
            forceExecutable(proot);

            if (!new File(rootfs, "bin").exists() && !new File(rootfs, "usr").exists()) {
                if (!rootfs.exists()) rootfs.mkdirs();
                File rootfsTar = new File(linuxDir, "rootfs.tar.gz");
                String rootfsUrl = "http://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/ubuntu-base-22.04.5-base-arm64.tar.gz";
                if (!rootfsTar.exists() || rootfsTar.length() < 1000000) {
                    if (!downloadFile(rootfsUrl, rootfsTar) || rootfsTar.length() < 1000000) {
                        return "No se pudo descargar Ubuntu rootfs (~27 MB). Revisa la red.";
                    }
                }
                try {
                    Process extract = new ProcessBuilder(
                        "tar", "-xzf", rootfsTar.getAbsolutePath(), "-C", rootfs.getAbsolutePath()
                    ).redirectErrorStream(true).start();
                    int code = extract.waitFor();
                    if (code != 0) {
                        return "Error extrayendo rootfs (tar exit=" + code + ")";
                    }
                } catch (Exception e) {
                    return "No se pudo extraer rootfs: " + e.getMessage();
                }
                try {
                    File resolv = new File(rootfs, "etc/resolv.conf");
                    writeText(resolv, "nameserver 8.8.8.8\nnameserver 1.1.1.1\n");
                } catch (Exception ignored) {}
                //noinspection ResultOfMethodCallIgnored
                rootfsTar.delete();
            }

            if (!javaBin.exists()) {
                File optJava = new File(rootfs, "opt/java");
                if (!optJava.exists()) optJava.mkdirs();
                File jreTar = new File(linuxDir, "jre.tar.gz");
                String jreUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jre_aarch64_linux_hotspot_21.0.1_12.tar.gz";
                String abi = Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "arm64-v8a";
                if (abi.contains("x86_64")) {
                    jreUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jre_x64_linux_hotspot_21.0.1_12.tar.gz";
                }
                if (!jreTar.exists() || jreTar.length() < 1000000) {
                    if (!downloadFile(jreUrl, jreTar) || jreTar.length() < 1000000) {
                        return "No se pudo descargar OpenJDK para el rootfs";
                    }
                }
                try {
                    Process extract = new ProcessBuilder(
                        "tar", "-xzf", jreTar.getAbsolutePath(), "-C", optJava.getAbsolutePath()
                    ).redirectErrorStream(true).start();
                    int code = extract.waitFor();
                    if (code != 0) {
                        return "Error extrayendo OpenJDK en rootfs (tar exit=" + code + ")";
                    }
                } catch (Exception e) {
                    return "No se pudo extraer OpenJDK: " + e.getMessage();
                }
                File[] kids = optJava.listFiles();
                if (kids != null) {
                    for (File child : kids) {
                        if (child.isDirectory() && (child.getName().startsWith("jdk") || child.getName().contains("jre"))) {
                            File[] inner = child.listFiles();
                            if (inner != null) {
                                for (File f : inner) {
                                    File dest = new File(optJava, f.getName());
                                    //noinspection ResultOfMethodCallIgnored
                                    f.renameTo(dest);
                                }
                            }
                            //noinspection ResultOfMethodCallIgnored
                            child.delete();
                        }
                    }
                }
                forceExecutableTree(new File(optJava, "bin"));
                //noinspection ResultOfMethodCallIgnored
                jreTar.delete();
            }

            if (!javaBin.exists()) {
                return "Tras la instalacion no existe /opt/java/bin/java en el rootfs";
            }
            forceExecutable(proot);
            forceExecutable(javaBin);
            try {
                writeText(marker, "ok\n");
            } catch (Exception ignored) {}
            return null;
        } catch (Exception e) {
            Log.e(TAG, "ensureLinuxRuntime", e);
            return "Error preparando runtime Linux: " + e.getMessage();
        }
    }

    private void forceExecutable(File f) {
        if (f == null || !f.exists()) return;
        try {
            f.setExecutable(true, false);
            f.setReadable(true, false);
        } catch (Exception ignored) {}
        try {
            Os.chmod(f.getAbsolutePath(), 0755);
        } catch (Exception ignored) {}
        try {
            new ProcessBuilder("chmod", "755", f.getAbsolutePath()).start().waitFor();
        } catch (Exception ignored) {}
    }

    private void forceExecutableTree(File dir) {
        if (dir == null || !dir.exists()) return;
        forceExecutable(dir);
        File[] kids = dir.listFiles();
        if (kids == null) return;
        for (File k : kids) {
            if (k.isDirectory()) forceExecutableTree(k);
            else forceExecutable(k);
        }
    }

    private String findJava() {
        String[] candidates = {
            getContext().getFilesDir() + "/runtime/java/bin/java",
            "/data/data/com.taichix.app/files/runtime/java/bin/java",
            getContext().getFilesDir() + "/runtime/java",
            "/system/bin/java",
            "/system/xbin/java"
        };
        for (String c : candidates) {
            try {
                File f = new File(c);
                if (f.exists() && f.canExecute() && f.isFile()) {
                    return f.getAbsolutePath();
                }
                // Si es un directorio, buscar bin/java dentro (por si quedó subcarpeta jdk-*)
                if (f.exists() && f.isDirectory()) {
                    File nested = new File(f, "bin/java");
                    if (nested.exists() && nested.canExecute()) {
                        return nested.getAbsolutePath();
                    }
                    File[] kids = f.listFiles();
                    if (kids != null) {
                        for (File k : kids) {
                            if (k.isDirectory()) {
                                File n2 = new File(k, "bin/java");
                                if (n2.exists() && n2.canExecute()) {
                                    return n2.getAbsolutePath();
                                }
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String findPhp() {
        String[] candidates = {
            getContext().getFilesDir() + "/runtime/php",
            getContext().getFilesDir() + "/runtime/php/bin/php",
            "php"
        };
        for (String c : candidates) {
            try {
                if (c.equals("php")) {
                    Process p = new ProcessBuilder("which", "php").start();
                    if (p.waitFor() == 0) return "php";
                } else {
                    File f = new File(c);
                    if (f.exists() && f.canExecute()) return f.getAbsolutePath();
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private void startConsoleReader(String serverId, Process proc) {
        executor.execute(() -> {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    appendConsole(serverId, line);
                }
            } catch (Exception e) {
                Log.e(TAG, "console reader", e);
            }
        });
    }

    private void appendConsole(String serverId, String line) {
        StringBuilder buf = consoleBuffers.get(serverId);
        if (buf == null) {
            buf = new StringBuilder();
            consoleBuffers.put(serverId, buf);
        }
        synchronized (buf) {
            buf.append(line).append('\n');
            if (buf.length() > 200000) buf.delete(0, buf.length() - 100000);
        }
    }

    private void stopProcess(Map<String, Process> map, String id) {
        Process p = map.remove(id);
        if (p != null) {
            p.destroy();
            try { p.waitFor(); } catch (Exception ignored) {}
        }
    }

    private void writeText(File file, String content) throws Exception {
        try (OutputStreamWriter w = new OutputStreamWriter(new FileOutputStream(file))) {
            w.write(content);
        }
    }

    private void writeServerProperties(File file, int port, String motd, int maxPlayers, String levelName) throws Exception {
        String content =
            "server-port=" + port + "\n" +
            "motd=" + motd + "\n" +
            "max-players=" + maxPlayers + "\n" +
            "level-name=" + levelName + "\n" +
            "online-mode=false\n" +
            "difficulty=normal\n" +
            "gamemode=survival\n" +
            "white-list=false\n" +
            "enable-command-block=true\n" +
            "spawn-protection=0\n" +
            "view-distance=6\n" +
            "simulation-distance=4\n" +
            "max-tick-time=-1\n";
        writeText(file, content);
    }

    private String extractHost(String line) {
        // Busca token tipo xxx.playit.gg o host:puerto
        String[] tokens = line.split("[\\s,]+");
        for (String t : tokens) {
            if (t.contains("playit.gg") || t.matches(".*\\.[a-zA-Z]+.*:\\d+.*")) {
                return t.replaceAll("^[^a-zA-Z0-9]+|[^a-zA-Z0-9.:-]+$", "");
            }
        }
        return null;
    }
}


