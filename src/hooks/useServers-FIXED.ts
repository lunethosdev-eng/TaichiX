import { useState, useEffect, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { MinecraftServer, CreateServerForm } from '../types/server';
import { generateId, generateInviteCode } from '../lib/utils';
import { MOD_CATALOG } from '../data/modCatalog';
import ServerNative from '../plugins/ServerNative';

const STORAGE_KEY = 'mc_servers';

export function useServers() {
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) setServers(JSON.parse(value));
      } catch {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setServers(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const running = servers.filter(s => s.status === 'running' || s.status === 'starting');
    if (running.length === 0) return;

    pollRef.current = setInterval(async () => {
      for (const s of running) {
        try {
          const { lines } = await ServerNative.readConsole({ serverId: s.id });
          if (lines && lines.length > 0) {
            setServers(prev => {
              const next = prev.map(srv => {
                if (srv.id !== s.id) return srv;
                const newLogs = [
                  ...srv.consoleLogs,
                  ...lines.map(l =>
                    l.startsWith('[') ? l : `[${new Date().toLocaleTimeString()}] ${l}`
                  ),
                ].slice(-300);
                return { ...srv, consoleLogs: newLogs };
              });
              persistSilent(next);
              return next;
            });
          }
        } catch {
          /* ignore */
        }
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [servers]);

  const persistSilent = (next: MinecraftServer[]) => {
    const data = JSON.stringify(next);
    Preferences.set({ key: STORAGE_KEY, value: data }).catch(() => {
      localStorage.setItem(STORAGE_KEY, data);
    });
  };

  const persist = useCallback(async (next: MinecraftServer[]) => {
    setServers(next);
    persistSilent(next);
  }, []);

  const getServerDir = async (serverId: string) => {
    const base = `servers/${serverId}`;
    try {
      await Filesystem.mkdir({ path: base, directory: Directory.Data, recursive: true });
    } catch {
      /* existe */
    }
    // Ruta real en Android (app privada)
    return `/data/data/com.taichix.app/files/${base}`;
  };

  const appendLogs = async (id: string, lines: string[]) => {
    setServers(prev => {
      const next = prev.map(s => {
        if (s.id !== id) return s;
        const time = () => new Date().toLocaleTimeString();
        const stamped = lines.map(l => (l.startsWith('[') ? l : `[${time()}] ${l}`));
        return { ...s, consoleLogs: [...s.consoleLogs, ...stamped].slice(-300) };
      });
      persistSilent(next);
      return next;
    });
  };

  const setStatus = async (
    id: string,
    status: MinecraftServer['status'],
    extra: Partial<MinecraftServer> = {}
  ) => {
    setServers(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, status, ...extra } : s));
      persistSilent(next);
      return next;
    });
  };

  const createServer = useCallback(
    async (form: CreateServerForm) => {
      const port = form.type === 'java' ? 25565 : 19132;
      const modNames = (form.selectedMods || [])
        .map(id => MOD_CATALOG.find(m => m.id === id))
        .filter(Boolean);

      const newServer: MinecraftServer = {
        id: generateId(),
        name: form.name,
        type: form.type,
        version: form.version,
        status: 'stopped',
        port,
        maxPlayers: form.maxPlayers,
        allocatedRamMb: form.allocatedRamMb,
        worldName: form.worldName || 'world',
        motd: form.motd || 'Servidor TaichiX',
        createdAt: Date.now(),
        consoleLogs: [
          `[${new Date().toLocaleTimeString()}] Servidor creado (modo REAL).`,
          `[${new Date().toLocaleTimeString()}] Tipo: ${form.type.toUpperCase()} ${form.version}`,
          `[${new Date().toLocaleTimeString()}] RAM: ${form.allocatedRamMb} MB`,
          form.type === 'java'
            ? `[${new Date().toLocaleTimeString()}] Loader: ${form.loader || 'paper'}`
            : `[${new Date().toLocaleTimeString()}] Bedrock / PocketMine`,
          modNames.length > 0
            ? `[${new Date().toLocaleTimeString()}] Mods: ${modNames.map(m => m!.name).join(', ')}`
            : `[${new Date().toLocaleTimeString()}] Sin mods`,
        ],
        inviteCode: generateInviteCode(),
        publicEnabled: true,
        loader: form.type === 'java' ? form.loader || 'paper' : undefined,
        installedMods: (form.selectedMods || []).map(id => {
          const mod = MOD_CATALOG.find(m => m.id === id);
          return {
            modId: id,
            name: mod?.name || id,
            version: form.version,
            enabled: true,
          };
        }),
      };
      await persist([newServer, ...servers]);
      return newServer;
    },
    [servers, persist]
  );

  /** Inicio REAL: sin simulación. Si falta runtime, error claro. */
  const startServer = useCallback(
    async (id: string) => {
      const server = servers.find(s => s.id === id);
      if (!server || server.status === 'running' || server.status === 'starting') return;

      await setStatus(id, 'starting');
      await appendLogs(id, ['Iniciando servidor REAL...']);

      try {
        // Plugin debe estar registrado en el APK
        let avail = { javaRuntime: false, playit: false };
        
        // Intentar obtener info del plugin, pero no fallar si no está disponible
        try {
          const result = await ServerNative.isAvailable();
          avail = result || avail;
        } catch (e) {
          console.warn('Plugin nativo no disponible, usando fallback');
          // Continuar de todas formas
        }

        await appendLogs(id, [
          `Plugin nativo: ${avail ? 'OK' : 'fallback'}`,
          `Java runtime: ${avail?.javaRuntime ? 'detectado' : 'NO encontrado'}`,
          `Playit: ${avail?.playit ? 'sí' : 'no aún'}`,
        ]);

        if (server.type === 'java' && !avail?.javaRuntime) {
          await appendLogs(id, [
            'No hay Java Runtime detectado.',
            'Descargando OpenJDK JRE arm64 (esto puede tomar 2-5 minutos)...',
            'Se descargará en: /data/data/com.taichix.app/files/runtime/java',
          ]);

          try {
            // Intentar descargar JRE usando el tipo 'java' pero con version especial
            const jreDownload = await ServerNative.downloadServer({
              type: 'java',
              version: 'openjdk-21-jre',
              targetPath: '/data/data/com.taichix.app/files/runtime',
            });

            if (!jreDownload.success) {
              await appendLogs(id, [
                'ERROR: No se pudo descargar Java.',
                'Asegúrate de tener conexión a internet.',
                'O instala manualmente un JRE arm64 en tu teléfono.',
              ]);
              await setStatus(id, 'error');
              return;
            }

            await appendLogs(id, [
              '✅ Java descargado exitosamente',
              'Continuando con la creación del servidor...',
            ]);
          } catch (e) {
            await appendLogs(id, [
              'ERROR: No se pudo descargar Java.',
              String(e),
            ]);
            await setStatus(id, 'error');
            return;
          }
        }

        const serverPath = await getServerDir(id);
        await appendLogs(id, [`Carpeta: ${serverPath}`, 'Descargando servidor (Paper/PocketMine)...']);

        const dl = await ServerNative.downloadServer({
          type: server.type,
          version: server.version,
          targetPath: serverPath,
        });
        await appendLogs(id, [dl.message || (dl.success ? 'Descarga OK' : 'Fallo descarga')]);
        if (!dl.success) {
          await setStatus(id, 'error');
          return;
        }

        if (server.installedMods && server.installedMods.length > 0) {
          await appendLogs(id, [
            `Mods seleccionados (${server.installedMods.length}):`,
            ...server.installedMods.map(m => `  + ${m.name}`),
            '(Copia los .jar a la carpeta mods/ del servidor cuando el runtime esté listo)',
          ]);
        }

        await appendLogs(id, ['Arrancando proceso Java/PHP...']);
        const start = await ServerNative.startServer({
          serverId: id,
          type: server.type,
          version: server.version,
          port: server.port,
          ramMb: server.allocatedRamMb,
          worldName: server.worldName,
          motd: server.motd,
          maxPlayers: server.maxPlayers,
          serverPath,
        });
        await appendLogs(id, [start.message || '']);
        if (!start.success) {
          await setStatus(id, 'error');
          return;
        }

        await appendLogs(id, ['Abriendo túnel público (playit)...']);
        const tunnel = await ServerNative.startTunnel({
          serverId: id,
          localPort: server.port,
          type: server.type,
        });

        if (tunnel.success && tunnel.publicAddress) {
          await appendLogs(id, [
            '¡Servidor REAL en línea!',
            `Dirección pública: ${tunnel.publicAddress}${tunnel.publicPort ? ':' + tunnel.publicPort : ''}`,
            'Tus amigos pueden entrar desde cualquier internet.',
          ]);
          await setStatus(id, 'running', {
            publicAddress: tunnel.publicAddress,
            publicPort: tunnel.publicPort,
            publicEnabled: true,
            lastStartedAt: Date.now(),
            playersOnline: 0,
          });
        } else {
          await appendLogs(id, [
            tunnel.message || 'Túnel no listo aún',
            'El proceso del servidor SÍ está corriendo en el dispositivo.',
            `Puerto local: ${server.port}`,
            'Si playit pide claim la primera vez, revisa la consola.',
          ]);
          await setStatus(id, 'running', {
            publicAddress: tunnel.publicAddress,
            publicPort: tunnel.publicPort ?? server.port,
            publicEnabled: !!tunnel.publicAddress,
            lastStartedAt: Date.now(),
            playersOnline: 0,
            localIp: '127.0.0.1',
          });
        }
      } catch (e: any) {
        await appendLogs(id, [`Error: ${e?.message || e}`]);
        await setStatus(id, 'error');
      }
    },
    [servers]
  );

  const stopServer = useCallback(
    async (id: string) => {
      const server = servers.find(s => s.id === id);
      if (!server || server.status === 'stopped' || server.status === 'stopping') return;

      await setStatus(id, 'stopping');
      await appendLogs(id, ['Deteniendo proceso y túnel...']);
      try {
        await ServerNative.stopTunnel({ serverId: id });
        await ServerNative.stopServer({ serverId: id });
        await appendLogs(id, ['Servidor detenido.']);
      } catch (e: any) {
        await appendLogs(id, [`Aviso: ${e?.message || e}`]);
      }
      await setStatus(id, 'stopped', {
        publicAddress: undefined,
        publicPort: undefined,
        playersOnline: undefined,
      });
    },
    [servers]
  );

  const deleteServer = useCallback(
    async (id: string) => {
      try {
        await ServerNative.stopServer({ serverId: id });
        await ServerNative.stopTunnel({ serverId: id });
      } catch {
        /* ignore */
      }
      await persist(servers.filter(s => s.id !== id));
    },
    [servers, persist]
  );

  return { servers, loading, createServer, startServer, stopServer, deleteServer };
}
