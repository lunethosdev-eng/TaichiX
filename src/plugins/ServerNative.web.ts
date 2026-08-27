import type {
  ServerNativePlugin,
  StartServerOptions,
  TunnelOptions,
} from './ServerNative';
import { generatePublicAddress } from '../lib/utils';

/**
 * Implementación WEB / fallback.
 * Si el plugin nativo no está registrado en el APK, Capacitor usa esta clase
 * en web; en Android sin registro lanza error (lo capturamos en useServers).
 */
export class ServerNativeWeb implements ServerNativePlugin {
  private running = new Map<
    string,
    { logs: string[]; publicAddress?: string; publicPort?: number }
  >();

  async isAvailable() {
    return { available: false, javaRuntime: false, playit: false };
  }

  async getMemoryInfo() {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (nav.deviceMemory) {
      const totalMb = Math.round(nav.deviceMemory * 1024);
      return {
        totalMb,
        availableMb: Math.round(totalMb * 0.55),
        usedMb: Math.round(totalMb * 0.45),
      };
    }
    return { totalMb: 4096, availableMb: 2048, usedMb: 2048 };
  }

  async downloadServer(options: {
    type: 'java' | 'bedrock';
    version: string;
    targetPath: string;
  }) {
    return {
      success: true,
      path: options.targetPath,
      message: `[web] Servidor ${options.type} ${options.version} listo (simulado)`,
    };
  }

  async startServer(options: StartServerOptions) {
    const logs = [
      `Iniciando ${options.type} ${options.version}...`,
      `RAM: ${options.ramMb} MB · Puerto: ${options.port}`,
      'Mundo: ' + options.worldName,
      'Done! For help, type "help"',
    ];
    this.running.set(options.serverId, { logs: [...logs] });
    return { success: true, pid: 1, message: 'Proceso iniciado (simulación web)' };
  }

  async stopServer(options: { serverId: string }) {
    this.running.delete(options.serverId);
    return { success: true, message: 'Detenido' };
  }

  async readConsole(options: { serverId: string }) {
    const entry = this.running.get(options.serverId);
    if (!entry) return { lines: [] };
    const lines = entry.logs.splice(0, entry.logs.length);
    return { lines };
  }

  async startTunnel(options: TunnelOptions) {
    const { address, port } = generatePublicAddress(options.type);
    const entry = this.running.get(options.serverId);
    if (entry) {
      entry.publicAddress = address;
      entry.publicPort = port;
    }
    return {
      success: true,
      publicAddress: address,
      publicPort: port,
      message: 'Túnel simulado activo',
    };
  }

  async stopTunnel(options: { serverId: string }) {
    const entry = this.running.get(options.serverId);
    if (entry) {
      entry.publicAddress = undefined;
      entry.publicPort = undefined;
    }
    return { success: true, message: 'Túnel cerrado' };
  }
}
