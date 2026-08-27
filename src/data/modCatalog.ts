import type { ModItem } from '../types/server';

/**
 * Catálogo local de mods / addons.
 * Se filtra por platform (java/bedrock) y versión del servidor.
 * En una versión futura se puede conectar a Modrinth / CurseForge / MCPEDL.
 */
export const MOD_CATALOG: ModItem[] = [
  // ─── JAVA ───────────────────────────────────────────
  {
    id: 'sodium',
    name: 'Sodium',
    description: 'Optimización gráfica extrema. Más FPS en clientes; ideal junto a Paper.',
    author: 'CaffeineMC',
    platform: 'java',
    loaders: ['fabric', 'quilt'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'optimization',
    sizeMb: 2,
    badge: 'Popular',
    icon: '⚡',
  },
  {
    id: 'lithium',
    name: 'Lithium',
    description: 'Optimiza el motor del servidor/juego sin cambiar gameplay.',
    author: 'CaffeineMC',
    platform: 'java',
    loaders: ['fabric', 'quilt'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'optimization',
    sizeMb: 1,
    badge: 'Ligero',
    icon: '🔋',
  },
  {
    id: 'iris',
    name: 'Iris Shaders',
    description: 'Soporte de shaders en Fabric. Pesado en móviles.',
    author: 'Iris Team',
    platform: 'java',
    loaders: ['fabric'],
    versions: ['1.21', '1.20'],
    category: 'cosmetic',
    sizeMb: 8,
    heavy: true,
    icon: '🌅',
  },
  {
    id: 'create',
    name: 'Create',
    description: 'Automatización steampunk: engranajes, trenes, fábricas.',
    author: 'simibubi',
    platform: 'java',
    loaders: ['forge', 'fabric'],
    versions: ['1.21', '1.20', '1.19'],
    category: 'tech',
    sizeMb: 25,
    badge: 'Top',
    heavy: true,
    icon: '⚙️',
  },
  {
    id: 'jei',
    name: 'Just Enough Items (JEI)',
    description: 'Ver recetas e items en el inventario. Imprescindible con mods.',
    author: 'mezz',
    platform: 'java',
    loaders: ['forge', 'fabric', 'quilt'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'utility',
    sizeMb: 3,
    badge: 'Esencial',
    icon: '📋',
  },
  {
    id: 'waystones',
    name: 'Waystones',
    description: 'Piedras de teletransporte para viajar rápido por el mundo.',
    author: 'BlayTheNinth',
    platform: 'java',
    loaders: ['forge', 'fabric'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'utility',
    sizeMb: 2,
    icon: '🗿',
  },
  {
    id: 'biomesoplenty',
    name: 'Biomes O\' Plenty',
    description: 'Docenas de biomas nuevos y generación de mundo más rica.',
    author: 'Forstride',
    platform: 'java',
    loaders: ['forge', 'fabric'],
    versions: ['1.21', '1.20', '1.19'],
    category: 'adventure',
    sizeMb: 15,
    heavy: true,
    icon: '🌲',
  },
  {
    id: 'botania',
    name: 'Botania',
    description: 'Magia basada en flores y maná. Tech-magic.',
    author: 'Vazkii',
    platform: 'java',
    loaders: ['forge', 'fabric'],
    versions: ['1.20', '1.19'],
    category: 'magic',
    sizeMb: 12,
    icon: '🌸',
  },
  {
    id: 'simple-voice-chat',
    name: 'Simple Voice Chat',
    description: 'Chat de voz proximity en el servidor.',
    author: 'henkelmax',
    platform: 'java',
    loaders: ['forge', 'fabric', 'quilt'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'utility',
    sizeMb: 4,
    badge: 'Multijugador',
    icon: '🎤',
  },
  {
    id: 'spark',
    name: 'spark',
    description: 'Profiler de rendimiento del servidor. Ideal para diagnosticar lag.',
    author: 'Luck',
    platform: 'java',
    loaders: ['paper', 'fabric', 'forge', 'quilt'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'utility',
    sizeMb: 1,
    badge: 'Admin',
    icon: '📊',
  },
  {
    id: 'luckperms',
    name: 'LuckPerms',
    description: 'Sistema de permisos y rangos para el servidor.',
    author: 'Luck',
    platform: 'java',
    loaders: ['paper', 'fabric', 'forge'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'utility',
    sizeMb: 3,
    badge: 'Admin',
    icon: '🔐',
  },
  {
    id: 'worldedit',
    name: 'WorldEdit',
    description: 'Edición masiva del terreno. Construir más rápido.',
    author: 'EngineHub',
    platform: 'java',
    loaders: ['paper', 'fabric', 'forge'],
    versions: ['1.21', '1.20', '1.19', '1.18'],
    category: 'utility',
    sizeMb: 5,
    icon: '🪓',
  },

  // ─── BEDROCK (addons / behavior + resource packs) ───
  {
    id: 'bedrock-weapons',
    name: 'More Weapons+',
    description: 'Nuevas armas y herramientas con animaciones.',
    author: 'MCPEDL Community',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'gameplay',
    sizeMb: 6,
    badge: 'Popular',
    icon: '⚔️',
  },
  {
    id: 'bedrock-furniture',
    name: 'Fantastic Furniture',
    description: 'Muebles decorativos para casas y builds.',
    author: 'MCPEDL',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'cosmetic',
    sizeMb: 8,
    icon: '🛋️',
  },
  {
    id: 'bedrock-cars',
    name: 'Vehicles & Cars',
    description: 'Coches y vehículos conducibles.',
    author: 'Community',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'gameplay',
    sizeMb: 12,
    heavy: true,
    icon: '🚗',
  },
  {
    id: 'bedrock-shaders-lite',
    name: 'RenderDragon Shaders Lite',
    description: 'Mejoras visuales ligeras compatibles con móviles.',
    author: 'Community',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'cosmetic',
    sizeMb: 3,
    badge: 'Móvil',
    icon: '✨',
  },
  {
    id: 'bedrock-mobs',
    name: 'More Mobs',
    description: 'Nuevos enemigos y criaturas en el mundo.',
    author: 'Community',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'adventure',
    sizeMb: 10,
    icon: '👾',
  },
  {
    id: 'bedrock-economy',
    name: 'Economy & Shops',
    description: 'Sistema de dinero, tiendas y ranking para servidores.',
    author: 'PMMP Plugins',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'utility',
    sizeMb: 2,
    badge: 'Servidor',
    icon: '💰',
  },
  {
    id: 'bedrock-minigames',
    name: 'MiniGames Pack',
    description: 'Parkour, PvP arenas y minijuegos listos.',
    author: 'PMMP',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'gameplay',
    sizeMb: 5,
    icon: '🎮',
  },
  {
    id: 'bedrock-oneblock',
    name: 'OneBlock Adventure',
    description: 'Mapa/addon OneBlock con progresión.',
    author: 'Maps',
    platform: 'bedrock',
    versions: ['1.21', '1.20'],
    category: 'map',
    sizeMb: 15,
    badge: 'Mapa',
    icon: '🧱',
  },
];

/** Comprueba si un mod es compatible con tipo + versión + loader */
export function isModCompatible(
  mod: ModItem,
  platform: 'java' | 'bedrock',
  mcVersion: string,
  loader?: string
): boolean {
  if (mod.platform !== platform) return false;

  // Versión: coincide si el catálogo tiene prefijo (1.21) o exacta (1.21.4)
  const versionOk = mod.versions.some(
    v => mcVersion === v || mcVersion.startsWith(v) || v.startsWith(mcVersion.split('.').slice(0, 2).join('.'))
  );
  if (!versionOk) return false;

  if (platform === 'java' && mod.loaders && loader && loader !== 'vanilla') {
    return mod.loaders.includes(loader as any);
  }
  // vanilla: solo mostrar optimización/utilidad “suaves” o todos si no hay loader
  if (platform === 'java' && loader === 'vanilla') {
    return !mod.loaders || mod.loaders.includes('paper');
  }
  return true;
}

export function filterMods(
  platform: 'java' | 'bedrock',
  mcVersion: string,
  loader?: string,
  query?: string,
  category?: string
): ModItem[] {
  let list = MOD_CATALOG.filter(m => isModCompatible(m, platform, mcVersion, loader));

  if (category && category !== 'all') {
    list = list.filter(m => m.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q)
    );
  }
  return list;
}
