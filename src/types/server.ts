export type ServerType = 'java' | 'bedrock';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export type ModLoader = 'vanilla' | 'paper' | 'fabric' | 'forge' | 'quilt';

export type ModCategory =
  | 'adventure'
  | 'tech'
  | 'magic'
  | 'optimization'
  | 'map'
  | 'utility'
  | 'cosmetic'
  | 'gameplay';

export interface ModItem {
  id: string;
  name: string;
  description: string;
  author: string;
  platform: ServerType;
  loaders?: ModLoader[];
  versions: string[];
  category: ModCategory;
  sizeMb: number;
  badge?: string;
  heavy?: boolean;
  icon?: string;
}

export interface InstalledMod {
  modId: string;
  name: string;
  version: string;
  enabled: boolean;
}

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
  publicAddress?: string;
  publicPort?: number;
  publicEnabled?: boolean;
  loader?: ModLoader;
  installedMods?: InstalledMod[];
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
  loader?: ModLoader;
  selectedMods?: string[];
}
