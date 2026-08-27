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
  /** Ruta donde están los archivos del servidor en el dispositivo */
  serverPath: string;
}

export interface TunnelOptions {
  serverId: string;
  localPort: number;
  type: 'java' | 'bedrock';
}

export interface ServerNativePlugin {
  /** Comprueba si el plugin nativo está disponible */
  isAvailable(): Promise<{ available: boolean; javaRuntime: boolean; playit: boolean }>;

  /** Descarga el servidor (jar de Java o PocketMine) si no existe */
  downloadServer(options: {
    type: 'java' | 'bedrock';
    version: string;
    targetPath: string;
  }): Promise<{ success: boolean; path: string; message: string }>;

  /** Inicia el proceso del servidor */
  startServer(options: StartServerOptions): Promise<{
    success: boolean;
    pid?: number;
    message: string;
  }>;

  /** Detiene el proceso del servidor */
  stopServer(options: { serverId: string }): Promise<{ success: boolean; message: string }>;

  /** Lee nuevas líneas de la consola del servidor */
  readConsole(options: { serverId: string }): Promise<{ lines: string[] }>;

  /** Inicia el túnel playit.gg (o compatible) */
  startTunnel(options: TunnelOptions): Promise<{
    success: boolean;
    publicAddress?: string;
    publicPort?: number;
    message: string;
  }>;

  /** Detiene el túnel */
  stopTunnel(options: { serverId: string }): Promise<{ success: boolean; message: string }>;

  /** Obtiene RAM real del dispositivo (nativo) */
  getMemoryInfo(): Promise<{
    totalMb: number;
    availableMb: number;
    usedMb: number;
  }>;
}

const ServerNative = registerPlugin<ServerNativePlugin>('ServerNative', {
  web: () => import('./ServerNative.web').then(m => new m.ServerNativeWeb()),
});

export default ServerNative;
