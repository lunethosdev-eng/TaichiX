import { useState } from 'react';
import { Plus, Server, Smartphone, Info, Globe } from 'lucide-react';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { useServers } from './hooks/useServers';
import { RamWarning } from './components/RamWarning';
import { CreateServerModal } from './components/CreateServerModal';
import { ServerCard } from './components/ServerCard';
import { ConsoleModal } from './components/ConsoleModal';
import { Button, Card } from './components/ui';
import { formatRam } from './lib/utils';
import type { MinecraftServer } from './types/server';

export default function App() {
  const { deviceInfo, loading: deviceLoading } = useDeviceInfo();
  const { servers, loading: serversLoading, createServer, startServer, stopServer, deleteServer } = useServers();
  const [showCreate, setShowCreate] = useState(false);
  const [consoleServer, setConsoleServer] = useState<MinecraftServer | null>(null);

  const runningCount = servers.filter(s => s.status === 'running').length;

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight mc-title">TaichiX</h1>
              <p className="text-[10px] text-slate-400">Servidores Java y Bedrock</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Crear
          </Button>
        </div>
      </header>

      <RamWarning deviceInfo={deviceInfo} />

      <main className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {deviceLoading ? 'Cargando...' : deviceInfo.model}
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span>RAM total ~{formatRam(deviceInfo.totalRamMb)}</span>
                <span>Disponible ~{formatRam(deviceInfo.availableRamMb)}</span>
                <span className="capitalize">{deviceInfo.platform}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-white">{servers.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Servidores</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{runningCount}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">En línea</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {servers.filter(s => s.type === 'java').length}/{servers.filter(s => s.type === 'bedrock').length}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Java / Bedrock</div>
          </Card>
        </div>

        {serversLoading ? (
          <div className="text-center py-12 text-slate-500">Cargando servidores...</div>
        ) : servers.length === 0 ? (
          <Card className="p-8 text-center">
            <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-300">No tienes servidores</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Crea un servidor Java o Bedrock. TaichiX lo ejecuta en tu dispositivo
              y abre un túnel público para que tus amigos entren desde cualquier internet.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Crear mi primer servidor
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {servers.map(server => (
              <ServerCard
                key={server.id}
                server={server}
                onStart={() => startServer(server.id)}
                onStop={() => stopServer(server.id)}
                onDelete={() => {
                  if (confirm(`¿Eliminar "${server.name}"?`)) deleteServer(server.id);
                }}
                onOpenConsole={() => setConsoleServer(server)}
              />
            ))}
          </div>
        )}

        <Card className="p-4 border-dashed">
          <div className="flex gap-2">
            <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1.5">
              <p>
                <strong className="text-emerald-300">Todo dentro de TaichiX</strong>
              </p>
              <p>
                No necesitas Termux ni otras apps. Al iniciar, TaichiX descarga el servidor,
                lo ejecuta con la RAM que elijas y abre un túnel público automáticamente.
              </p>
              <p>
                Comparte la dirección pública con tus amigos. Entran desde <strong className="text-slate-300">cualquier internet</strong>.
              </p>
              <p className="text-slate-500 pt-1">
                <Info className="w-3 h-3 inline mr-1" />
                Java usa más RAM. Bedrock es más ligero. Si hay poca memoria, la app te avisa.
              </p>
            </div>
          </div>
        </Card>
      </main>

      <CreateServerModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createServer}
        deviceInfo={deviceInfo}
      />

      <ConsoleModal
        server={consoleServer}
        onClose={() => setConsoleServer(null)}
      />
    </div>
  );
}
