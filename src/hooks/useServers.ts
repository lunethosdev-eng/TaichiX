import { useState, useEffect, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { MinecraftServer, CreateServerForm, ServerStatus } from '../types/server';
import { generateId, generateInviteCode } from '../lib/utils';
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

  // Poll consola de servidores en ejecución
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
                const newLogs = [...srv.consoleLogs, ...lines.map(l => l.startsWith('[') ? l : `[${new Date().toLocaleTimeString()}] ${l}`)].slice(-300);
                return { ...srv, consoleLogs: newLogs };
              });
              persistSilent(next);
              return next;
            });
          }
        } catch { /* ignore */ }
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
    // Usar directorio de datos de la app
    const base = `servers/${serverId}`;
    try {
      await Filesystem.mkdir({ path: base, directory: Directory.Data, recursive: true });
    } catch { /* ya existe */ }
    // Ruta absoluta aproximada en Android
    return `/data/data/com.taichix.app/files/${base}`;
  };

  const createServer = useCallback(async (form: CreateServerForm) => {
    const port = form.type === 'java' ? 25565 : 19132;
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
      motd: form.motd || 'Servidor creado con TaichiX App',
      createdAt: Date.now(),
      consoleLogs: [
        `[${new Date().toLocaleTimeString()}] Servidor creado.`,
        `[${new Date().toLocaleTimeString()}] Tipo: ${form.type.toUpperCase()} ${form.version}`,
        `[${new Date().toLocaleTimeString()}] RAM: ${form.allocatedRamMb} MB`,
        `[${new Date().toLocaleTimeString()}] Al iniciar se descargará el servidor y se abrirá túnel público (playit).`,
      ],
      inviteCode: generateInviteCode(),
      publicEnabled: true,
    };
    await persist([newServer, ...servers]);
    return newServer;
  }, [servers, persist]);

  const appendLogs = async (id: string, lines: string[]) => {
    setServers(prev => {
      const next = prev.map(s => {
        if (s.id !== id) return s;
        const time = () => new Date().toLocaleTimeString();
        const stamped = lines.map(l => l.startsWith('[') ? l : `[${time()}] ${l}`);
        return { ...s, consoleLogs: [...s.consoleLogs, ...stamped].slice(-300) };
      });
      persistSilent(next);
      return next;
    });
  };

  const setStatus = async (id: string, status: ServerStatus, extra?: Partial<MinecraftServer>) => {
    setServers(prev => {
      const next = prev.map(s => s.id === id ? { ...s, status, ...extra } : s);
      persistSilent(next);
      return next;
    });
  };

  const startServer = useCallback(async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server || server.status === 'running' || server.status === 'starting') return;

    await setStatus(id, 'starting');
    await appendLogs(id, ['Iniciando servidor...', 'Comprobando runtime nativo...']);

    try {
      const avail = await ServerNative.isAvailable();
      await appendLogs(id, [
        `Plugin nativo: ${avail.available ? 'sí' : 'no (modo web/simulado)'}`,
        `Java runtime: ${avail.javaRuntime ? 'detectado' : 'no detectado'}`,
        `playit: ${avail.playit ? 'detectado' : 'se intentará descargar'}`,
      ]);

      const serverPath = await getServerDir(id);
      await appendLogs(id, [`Directorio: ${serverPath}`, 'Descargando archivos del servidor...']);

      const dl = await ServerNative.downloadServer({
        type: server.type,
        version: server.version,
        targetPath: serverPath,
      });
      await appendLogs(id, [dl.message]);

      await appendLogs(id, ['Arrancando proceso del servidor...']);
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

      if (!start.success) {
        await appendLogs(id, [`Error: ${start.message}`]);
        await setStatus(id, 'error');
        return;
      }
      await appendLogs(id, [start.message, 'Iniciando túnel público (playit.gg)...']);

      const tunnel = await ServerNative.startTunnel({
        serverId: id,
        localPort: server.port,
        type: server.type,
      });

      if (tunnel.success && tunnel.publicAddress) {
        await appendLogs(id, [
          '🌐 Túnel público activo',
          `Dirección: ${tunnel.publicAddress}${tunnel.publicPort ? ':' + tunnel.publicPort : ''}`,
          'Tus amigos pueden unirse DESDE CUALQUIER INTERNET',
        ]);
        await setStatus(id, 'running', {
          publicAddress: tunnel.publicAddress,
          publicPort: tunnel.publicPort,
          publicEnabled: true,
          lastStartedAt: Date.now(),
          playersOnline: 0,
        });
      } else {
        // Túnel no devolvió dirección todavía (playit necesita claim) o falló
        await appendLogs(id, [
          tunnel.message || 'Túnel iniciado (puede requerir claim la primera vez)',
          'Si no aparece dirección pública, completa el claim del túnel la primera vez (solo una vez).',
        ]);
        // Aun así marcamos running; la dirección puede llegar por consola después
        const fallbackAddr = tunnel.publicAddress || undefined;
        await setStatus(id, 'running', {
          publicAddress: fallbackAddr,
          publicPort: tunnel.publicPort ?? server.port,
          publicEnabled: true,
          lastStartedAt: Date.now(),
          playersOnline: 0,
          localIp: '127.0.0.1',
        });
      }
    } catch (e: any) {
      await appendLogs(id, [`Error crítico: ${e?.message || e}`]);
      await setStatus(id, 'error');
    }
  }, [servers]);

  const stopServer = useCallback(async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server || server.status === 'stopped' || server.status === 'stopping') return;

    await setStatus(id, 'stopping');
    await appendLogs(id, ['Deteniendo servidor y túnel...']);

    try {
      await ServerNative.stopTunnel({ serverId: id });
      await ServerNative.stopServer({ serverId: id });
      await appendLogs(id, ['Servidor detenido. Túnel cerrado.']);
      await setStatus(id, 'stopped', {
        publicAddress: undefined,
        publicPort: undefined,
        playersOnline: undefined,
      });
    } catch (e: any) {
      await appendLogs(id, [`Error al detener: ${e?.message || e}`]);
      await setStatus(id, 'stopped');
    }
  }, [servers]);

  const deleteServer = useCallback(async (id: string) => {
    try {
      await ServerNative.stopServer({ serverId: id });
      await ServerNative.stopTunnel({ serverId: id });
    } catch { /* ignore */ }
    await persist(servers.filter(s => s.id !== id));
  }, [servers, persist]);

  return {
    servers,
    loading,
    createServer,
    startServer,
    stopServer,
    deleteServer,
  };
}
