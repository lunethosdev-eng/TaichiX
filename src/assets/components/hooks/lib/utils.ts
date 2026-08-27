import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Genera una dirección pública estilo túnel TaichiX / playit */
export function generatePublicAddress(type: 'java' | 'bedrock'): { address: string; port: number } {
  const adjectives = ['epic', 'craft', 'pixel', 'block', 'mine', 'nether', 'end', 'survival', 'creative', 'hardcore'];
  const nouns = ['realm', 'world', 'server', 'base', 'fort', 'cave', 'island', 'spawn'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  const subdomain = `${adj}-${noun}-${num}`;
  const address = `${subdomain}.play.taichix.app`;
  const port = type === 'java' ? 25565 : 19132;
  return { address, port };
}

export function formatRam(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function getRecommendedRam(type: 'java' | 'bedrock', availableMb: number): number {
  if (type === 'java') {
    return Math.min(Math.max(1024, Math.floor(availableMb * 0.4)), 4096);
  }
  return Math.min(Math.max(512, Math.floor(availableMb * 0.3)), 2048);
}
