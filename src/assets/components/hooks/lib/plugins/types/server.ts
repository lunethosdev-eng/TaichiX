export type ServerType = 'java' | 'bedrock';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface MinecraftServer {
  id: string;
  name: string;
  type: ServerType;
  version: string;
  status: ServerStatus;
  port: number;
  maxPlayers: number;
  allocatedRamMb: number;
  worldName: string;
  motd: string;
  createdAt: number;
  lastStartedAt?: number;
  playersOnline?: number;
  consoleLogs: string[];
  inviteCode?: string;
  localIp?: string;
  /** Dirección pública generada por el túnel (playit / ngrok style) */
  publicAddress?: string;
  /** Puerto público del túnel */
  publicPort?: number;
  /** Si el acceso público (túnel) está activo */
  publicEnabled?: boolean;
}

export interface DeviceInfo {
  totalRamMb: number;
  availableRamMb: number;
  model: string;
  platform: string;
  isLowRam: boolean;
}

export interface CreateServerForm {
  name: string;
  type: ServerType;
  version: string;
  maxPlayers: number;
  allocatedRamMb: number;
  worldName: string;
  motd: string;
}
