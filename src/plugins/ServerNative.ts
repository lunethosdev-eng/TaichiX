import { registerPlugin } from '@capacitor/core';

export interface StartServerOptions {
  serverId: string;
  type: 'java' | 'bedrock';
  version: string;
  port: number;
  ramMb: number;
  worldName: string;
  motd: string;
  maxPlayers: number;
  serverPath: string;
}

export interface TunnelOptions {
  serverId: string;
  localPort: number;
  type: 'java' | 'bedrock';
}

export interface ServerNativePlugin {
  isAvailable(): Promise<{ available: boolean; javaRuntime: boolean; playit: boolean }>;
  downloadServer(options: {
    type: 'java' | 'bedrock';
    version: string;
    targetPath: string;
  }): Promise<{ success: boolean; path: string; message: string }>;
  startServer(options: StartServerOptions): Promise<{
    success: boolean;
    pid?: number;
    message: string;
  }>;
  stopServer(options: { serverId: string }): Promise<{ success: boolean; message: string }>;
  readConsole(options: { serverId: string }): Promise<{ lines: string[] }>;
  startTunnel(options: TunnelOptions): Promise<{
    success: boolean;
    publicAddress?: string;
    publicPort?: number;
    message: string;
  }>;
  stopTunnel(options: { serverId: string }): Promise<{ success: boolean; message: string }>;
  getMemoryInfo(): Promise<{
    totalMb: number;
    availableMb: number;
    usedMb: number;
  }>;
}

// Crear plugin con fallback
let ServerNativePlugin: ServerNativePlugin | null = null;

try {
  ServerNativePlugin = registerPlugin<ServerNativePlugin>('ServerNative', {
    web: () => import('./ServerNative.web').then(m => new m.ServerNativeWeb()),
  });
} catch (error) {
  console.warn('⚠️ ServerNative plugin no disponible, usando fallback web');
  // Fallback a web
  import('./ServerNative.web').then(m => {
    ServerNativePlugin = new m.ServerNativeWeb() as any;
  });
}

export default ServerNativePlugin || ({
  isAvailable: async () => ({ available: false, javaRuntime: false, playit: false }),
  downloadServer: async () => ({ success: false, path: '', message: 'Plugin no disponible' }),
  startServer: async () => ({ success: false, message: 'Plugin no disponible' }),
  stopServer: async () => ({ success: false, message: 'Plugin no disponible' }),
  readConsole: async () => ({ lines: [] }),
  startTunnel: async () => ({ success: false, message: 'Plugin no disponible' }),
  stopTunnel: async () => ({ success: false, message: 'Plugin no disponible' }),
  getMemoryInfo: async () => ({ totalMb: 0, availableMb: 0, usedMb: 0 }),
} as ServerNativePlugin);
