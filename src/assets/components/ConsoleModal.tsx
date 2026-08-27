import { useEffect, useRef } from 'react';
import { X, Terminal } from 'lucide-react';
import type { MinecraftServer } from '../types/server';
import { Card, Badge } from './ui';

interface Props {
  server: MinecraftServer | null;
  onClose: () => void;
}

export function ConsoleModal({ server, onClose }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [server?.consoleLogs]);

  if (!server) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-b-none sm:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold">{server.name}</h2>
            <Badge color={server.status === 'running' ? 'green' : 'slate'}>
              {server.status}
            </Badge>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-black/40 min-h-[300px]">
          {server.consoleLogs.length === 0 ? (
            <p className="text-slate-500">Sin logs todavía...</p>
          ) : (
            server.consoleLogs.map((line, i) => (
              <div key={i} className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-slate-700 text-xs text-slate-500 shrink-0">
          {server.type === 'java' ? (
            <span>Servidor Java Edition · Puerto {server.port}</span>
          ) : (
            <span>Servidor Bedrock (PocketMine-MP) · Puerto {server.port}</span>
          )}
        </div>
      </Card>
    </div>
  );
}
