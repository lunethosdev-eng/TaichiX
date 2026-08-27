import type {
  ServerNativePlugin,
  StartServerOptions,
  TunnelOptions,
} from './ServerNative';
import { generatePublicAddress } from '../lib/utils';

/**
 * Implementación WEB / fallback.
 * En el navegador o si el plugin nativo no está, simula el comportamiento.
 * En el APK real se usa la implementación Java/Kotlin.
 */
export class ServerNativeWeb implements ServerNativePlugin {
  private running = new Map<string, { logs: string[]; publicAddress?: string; publicPort?: number }>();

  async isAvailable() {
    return { available: false, javaRuntime: false, playit: false };
  }

  async downloadServer(options: { type: 'java' | 'bedrock'; version: string; targetPath: string }) {
    // En web solo simulamos
    await delay(800);
    return {
      success: true,
      path: options.targetPath,
      message: `[web] Servidor ${options.type} ${options.version} listo (simulado)`,
    };
  }

  async startServer(options: StartServerOptions) {
    await delay(1500);
    const logs = [
      `Starting Minecraft server version ${options.version}`,
      `Loading properties`,
      `Default game type: SURVIVAL`,
      `Preparing level "${options.worldName}"`,
      `Done! For help, type "help"`,
      `Server started on port ${options.port}`,
    ];
    this.running.set(options.serverId, { logs });
    return { success: true, pid: Math.floor(Math.random() * 40000) + 1000, message: 'Servidor iniciado (simulado)' };
  }

  async stopServer(options: { serverId: string }) {
    this.running.delete(options.serverId);
    await delay(400);
    return { success: true, message: 'Servidor detenido' };
  }

  async readConsole(options: { serverId: string }) {
    const entry = this.running.get(options.serverId);
    if (!entry) return { lines: [] };
    const lines = [...entry.logs];
    entry.logs = []; // consumir
    return { lines };
  }

  async startTunnel(options: TunnelOptions) {
    await delay(1200);
    const { address, port } = generatePublicAddress(options.type);
    const entry = this.running.get(options.serverId);
    if (entry) {
      entry.publicAddress = address;
      entry.publicPort = port;
    } else {
      this.running.set(options.serverId, { logs: [], publicAddress: address, publicPort: port });
    }
    return {
      success: true,
      publicAddress: address,
      publicPort: port,
      message: 'Túnel público activo (simulado – en APK usa playit.gg real)',
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

  async getMemoryInfo() {
    // @ts-ignore
    const deviceMemory = navigator.deviceMemory ? navigator.deviceMemory * 1024 : 4096;
    return {
      totalMb: Math.round(deviceMemory),
      availableMb: Math.round(deviceMemory * 0.55),
      usedMb: Math.round(deviceMemory * 0.45),
    };
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
