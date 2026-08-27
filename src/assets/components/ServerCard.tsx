import { Play, Square, Trash2, Users, Cpu, Copy, Check, Terminal, Globe, Wifi } from 'lucide-react';
import { useState } from 'react';
import type { MinecraftServer } from '../types/server';
import { formatRam } from '../lib/utils';
import { Button, Card, Badge } from './ui';

interface Props {
  server: MinecraftServer;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onOpenConsole: () => void;
}

export function ServerCard({ server, onStart, onStop, onDelete, onOpenConsole }: Props) {
  const [copied, setCopied] = useState<'public' | 'local' | 'code' | null>(null);

  const statusColor = {
    stopped: 'slate',
    starting: 'yellow',
    running: 'green',
    stopping: 'yellow',
    error: 'red',
  }[server.status];

  const statusLabel = {
    stopped: 'Detenido',
    starting: 'Iniciando...',
    running: 'En línea',
    stopping: 'Deteniendo...',
    error: 'Error',
  }[server.status];

  const copyText = async (text: string, type: 'public' | 'local' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const publicFull = server.publicAddress
    ? `${server.publicAddress}${server.publicPort && server.publicPort !== 25565 && server.publicPort !== 19132 ? ':' + server.publicPort : ''}`
    : '';

  const inviteMessage = server.status === 'running' && server.publicAddress
    ? `¡Únete a mi servidor de Minecraft!\n\n` +
      `🌐 Dirección (cualquier internet):\n${publicFull}\n\n` +
      `Código: ${server.inviteCode}\n` +
      `Tipo: ${server.type === 'java' ? 'Java' : 'Bedrock'} ${server.version}\n\n` +
      `Solo pega la dirección en Minecraft y listo.`
    : '';

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{server.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge color={server.type === 'java' ? 'green' : 'blue'}>
                {server.type === 'java' ? 'Java' : 'Bedrock'} {server.version}
              </Badge>
              <Badge color={statusColor}>{statusLabel}</Badge>
              {server.status === 'running' && server.publicEnabled && (
                <Badge color="purple">🌐 Público</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {server.playersOnline ?? 0}/{server.maxPlayers}
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            {formatRam(server.allocatedRamMb)}
          </div>
        </div>

        {/* ACCESO PÚBLICO - desde cualquier internet */}
        {server.status === 'running' && server.publicAddress && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium mb-2">
              <Globe className="w-3.5 h-3.5" />
              Acceso desde CUALQUIER internet
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-emerald-200 break-all">
                {publicFull}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyText(publicFull, 'public')}
              >
                {copied === 'public' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-[11px] text-emerald-400/70 mt-1.5">
              Tus amigos pegan esta dirección en Minecraft (Direct Connection / Añadir servidor)
            </p>

            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => copyText(inviteMessage, 'code')}
              >
                {copied === 'code' ? (
                  <><Check className="w-3.5 h-3.5" /> ¡Copiado!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copiar invitación completa</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Local (opcional, misma WiFi) */}
        {server.status === 'running' && server.localIp && (
          <div className="mt-2 p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Wifi className="w-3 h-3" />
              Solo misma WiFi (opcional)
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-slate-300">
                {server.localIp}:{server.port}
              </code>
              <button
                onClick={() => copyText(`${server.localIp}:${server.port}`, 'local')}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                {copied === 'local' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-t border-slate-700/60 divide-x divide-slate-700/60">
        {server.status === 'running' || server.status === 'starting' ? (
          <button
            onClick={onStop}
            disabled={server.status === 'stopping' || server.status === 'starting'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
          >
            <Square className="w-4 h-4" /> Detener
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={server.status === 'error'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-emerald-400 hover:bg-emerald-950/30 transition-colors"
          >
            <Play className="w-4 h-4" /> Iniciar
          </button>
        )}
        <button
          onClick={onOpenConsole}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-slate-300 hover:bg-slate-700/40 transition-colors"
        >
          <Terminal className="w-4 h-4" /> Consola
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center px-4 py-2.5 text-sm text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
