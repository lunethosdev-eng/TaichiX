import { useState, useEffect, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { MinecraftServer, CreateServerForm } from '../types/server';
import { generateId, generateInviteCode, generatePublicAddress } from '../lib/utils';
import { MOD_CATALOG } from '../data/modCatalog';
import ServerNative from '../plugins/ServerNative';

const STORAGE_KEY = 'mc_servers';

function isPluginMissing(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '');
  return (
    msg.includes('not implemented') ||
    msg.includes('plugin is not implemented') ||
    msg.includes('ServerNative')
  );
}

/** Simulación local cuando el plugin nativo no está en el APK */
async function simulateStart(
  server: MinecraftServer,
  appendLogs: (id: string, lines: string[]) => Promise<void>
) {
  const id = server.id;
  await appendLogs(id, [
    'Plugin nativo no disponible en este APK → modo simulación.',
    'La UI funciona; el proceso real de Minecraft requiere el plugin Java registrado.',
  ]);

  if (server.installedMods && server.installedMods.length > 0) {
    await appendLogs(id, [
      `Cargando ${server.installedMods.length} mod(s)/addon(s):`,
      ...server.installedMods.map(m => `  + ${m.name}`),
    ]);
  }

  await appendLogs(id, [
    `Preparando ${server.type === 'java' ? 'Paper/Java' : 'PocketMine'} ${server.version}...`,
    `RAM: ${server.allocatedRamMb} MB · Puerto: ${server.port}`,
    'Descargando archivos del servidor (simulado)...',
  ]);
  await new Promise(r => setTimeout(r, 800));
  await appendLogs(id, ['Generando mundo...', 'Abriendo túnel público (simulado)...']);
  await new Promise(r => setTimeout(r, 600));

  const { address, port } = generatePublicAddress(server.type);
  await appendLogs(id, [
    '¡Servidor en línea! (simulación)',
    `Dirección pública: ${address}${port ? ':' + port : ''}`,
    'Tus amigos pueden usar esta dirección cuando el runtime nativo esté activo.',
  ]);
  return { address, port };
}

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
      /* ya existe */
    }
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
        motd: form.motd || 'Servidor creado con TaichiX',
        createdAt: Date.now(),
        consoleLogs: [
          `[${new Date().toLocaleTimeString()}] Servidor creado.`,
          `[${new Date().toLocaleTimeString()}] Tipo: ${form.type.toUpperCase()} ${form.version}`,
          `[${new Date().toLocaleTimeString()}] RAM: ${form.allocatedRamMb} MB`,
          form.type === 'java'
            ? `[${new Date().toLocaleTimeString()}] Loader: ${form.loader || 'paper'}`
            : `[${new Date().toLocaleTimeString()}] Bedrock / PocketMine`,
          modNames.length > 0
            ? `[${new Date().toLocaleTimeString()}] Mods/addons: ${modNames.map(m => m!.name).join(', ')}`
            : `[${new Date().toLocaleTimeString()}] Sin mods/addons`,
          `[${new Date().toLocaleTimeString()}] Al iniciar se preparará el servidor y el túnel público.`,
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

  const startServer = useCallback(
    async (id: string) => {
      const server = servers.find(s => s.id === id);
      if (!server || server.status === 'running' || server.status === 'starting') return;

      await setStatus(id, 'starting');
      await appendLogs(id, ['Iniciando servidor...']);

      try {
        // 1) ¿Plugin nativo disponible?
        let nativeOk = false;
        try {
          const avail = await ServerNative.isAvailable();
          nativeOk = !!avail?.available;
          await appendLogs(id, [
            `Runtime nativo: ${nativeOk ? 'OK' : 'no disponible'}`,
            avail?.javaRuntime ? 'Java runtime: detectado' : 'Java runtime: no detectado',
          ]);
        } catch (e) {
          if (isPluginMissing(e)) {
            const sim = await simulateStart(server, appendLogs);
            await setStatus(id, 'running', {
              publicAddress: sim.address,
              publicPort: sim.port,
              publicEnabled: true,
              lastStartedAt: Date.now(),
              playersOnline: 0,
              localIp: '127.0.0.1',
            });
            return;
          }
          throw e;
        }

        if (!nativeOk) {
          const sim = await simulateStart(server, appendLogs);
          await setStatus(id, 'running', {
            publicAddress: sim.address,
            publicPort: sim.port,
            publicEnabled: true,
            lastStartedAt: Date.now(),
            playersOnline: 0,
            localIp: '127.0.0.1',
          });
          return;
        }

        // 2) Descargar servidor
        const serverPath = await getServerDir(id);
        await appendLogs(id, ['Descargando archivos del servidor...']);
        const dl = await ServerNative.downloadServer({
          type: server.type,
          version: server.version,
          targetPath: serverPath,
        });
        await appendLogs(id, [dl.message || (dl.success ? 'Descarga lista' : 'Error en descarga')]);
        if (!dl.success) {
          await setStatus(id, 'error');
          return;
        }

        if (server.installedMods && server.installedMods.length > 0) {
          await appendLogs(id, [
            `Instalando ${server.installedMods.length} mod(s)/addon(s)...`,
            ...server.installedMods.map(m => `  + ${m.name}`),
          ]);
        }

        // 3) Arrancar proceso
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
        await appendLogs(id, [start.message || (start.success ? 'Proceso iniciado' : 'Fallo al iniciar')]);
        if (!start.success) {
          await setStatus(id, 'error');
          return;
        }

        // 4) Túnel público
        await appendLogs(id, ['Abriendo túnel público...']);
        const tunnel = await ServerNative.startTunnel({
          serverId: id,
          localPort: server.port,
          type: server.type,
        });

        if (tunnel.success && tunnel.publicAddress) {
          await appendLogs(id, [
            '¡Túnel público activo!',
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
          await appendLogs(id, [
            tunnel.message || 'Túnel iniciado (puede requerir configuración la primera vez)',
          ]);
          await setStatus(id, 'running', {
            publicAddress: tunnel.publicAddress,
            publicPort: tunnel.publicPort ?? server.port,
            publicEnabled: true,
            lastStartedAt: Date.now(),
            playersOnline: 0,
            localIp: '127.0.0.1',
          });
        }
      } catch (e: any) {
        if (isPluginMissing(e)) {
          const sim = await simulateStart(server, appendLogs);
          await setStatus(id, 'running', {
            publicAddress: sim.address,
            publicPort: sim.port,
            publicEnabled: true,
            lastStartedAt: Date.now(),
            playersOnline: 0,
            localIp: '127.0.0.1',
          });
          return;
        }
        await appendLogs(id, [`Error crítico: ${e?.message || e}`]);
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
      await appendLogs(id, ['Deteniendo servidor y túnel...']);

      try {
        await ServerNative.stopTunnel({ serverId: id });
        await ServerNative.stopServer({ serverId: id });
      } catch (e) {
        if (!isPluginMissing(e)) {
          await appendLogs(id, [`Aviso al detener: ${(e as any)?.message || e}`]);
        }
      }
      await appendLogs(id, ['Servidor detenido.']);
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

  return {
    servers,
    loading,
    createServer,
    startServer,
    stopServer,
    deleteServer,
  };
}
