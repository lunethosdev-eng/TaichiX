import { useState } from 'react';
import { X, Server, Cpu } from 'lucide-react';
import type { CreateServerForm, DeviceInfo, ServerType } from '../types/server';
import { getRecommendedRam, formatRam } from '../lib/utils';
import { Button, Card } from './ui';

const JAVA_VERSIONS = ['1.21.4', '1.21.3', '1.21.1', '1.20.6', '1.20.4', '1.19.4', '1.18.2'];
const BEDROCK_VERSIONS = ['1.21.50', '1.21.40', '1.21.30', '1.20.80'];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CreateServerForm) => Promise<void>;
  deviceInfo: DeviceInfo;
}

export function CreateServerModal({ open, onClose, onCreate, deviceInfo }: Props) {
  const [form, setForm] = useState<CreateServerForm>({
    name: '',
    type: 'java',
    version: '1.21.4',
    maxPlayers: 10,
    allocatedRamMb: getRecommendedRam('java', deviceInfo.availableRamMb),
    worldName: 'world',
    motd: '¡Bienvenido al servidor!',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleTypeChange = (type: ServerType) => {
    setForm(f => ({
      ...f,
      type,
      version: type === 'java' ? '1.21.4' : '1.21.50',
      allocatedRamMb: getRecommendedRam(type, deviceInfo.availableRamMb),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Ponle un nombre al servidor');
      return;
    }
    if (form.allocatedRamMb > deviceInfo.availableRamMb * 0.7) {
      setError(`Estás asignando demasiada RAM. Disponible ~${formatRam(deviceInfo.availableRamMb)}`);
      return;
    }
    setCreating(true);
    try {
      await onCreate(form);
      onClose();
      setForm({
        name: '',
        type: 'java',
        version: '1.21.4',
        maxPlayers: 10,
        allocatedRamMb: getRecommendedRam('java', deviceInfo.availableRamMb),
        worldName: 'world',
        motd: '¡Bienvenido al servidor!',
      });
    } catch {
      setError('Error al crear el servidor');
    } finally {
      setCreating(false);
    }
  };

  const versions = form.type === 'java' ? JAVA_VERSIONS : BEDROCK_VERSIONS;
  const isRiskyRam = form.allocatedRamMb > deviceInfo.availableRamMb * 0.5;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            Crear servidor
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Tipo de servidor</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('java')}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  form.type === 'java'
                    ? 'border-emerald-500 bg-emerald-950/40'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="font-semibold">Java Edition</div>
                <div className="text-xs text-slate-400 mt-0.5">PC / Mods / Plugins</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('bedrock')}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  form.type === 'bedrock'
                    ? 'border-blue-500 bg-blue-950/40'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="font-semibold">Bedrock</div>
                <div className="text-xs text-slate-400 mt-0.5">Móvil / Consola / Win10</div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nombre del servidor</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Mi servidor épico"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Versión</label>
              <select
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:outline-none"
              >
                {versions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Jugadores máx.</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.maxPlayers}
                onChange={e => setForm(f => ({ ...f, maxPlayers: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              RAM asignada: <strong className="text-white ml-1">{formatRam(form.allocatedRamMb)}</strong>
            </label>
            <input
              type="range"
              min={form.type === 'java' ? 512 : 256}
              max={Math.min(8192, Math.floor(deviceInfo.availableRamMb * 0.8))}
              step={128}
              value={form.allocatedRamMb}
              onChange={e => setForm(f => ({ ...f, allocatedRamMb: +e.target.value }))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{form.type === 'java' ? '512 MB' : '256 MB'}</span>
              <span>Disponible ~{formatRam(deviceInfo.availableRamMb)}</span>
            </div>
            {isRiskyRam && (
              <p className="text-xs text-amber-400 mt-1">
                ⚠️ Estás usando más del 50% de la RAM disponible. Puede causar cierres.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nombre del mundo</label>
            <input
              value={form.worldName}
              onChange={e => setForm(f => ({ ...f, worldName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">MOTD (mensaje del día)</label>
            <input
              value={form.motd}
              onChange={e => setForm(f => ({ ...f, motd: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? 'Creando...' : 'Crear servidor'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
