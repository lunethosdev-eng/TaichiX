import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import type { DeviceInfo } from '../types/server';
import { formatRam } from '../lib/utils';
import { Button } from './ui';

export function RamWarning({ deviceInfo }: { deviceInfo: DeviceInfo }) {
  const [dismissed, setDismissed] = useState(false);

  if (!deviceInfo.isLowRam || dismissed) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-600/50 bg-amber-950/40 p-4 flex items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-amber-300">Advertencia de poca RAM</h3>
        <p className="text-sm text-amber-200/80 mt-1">
          Tu dispositivo tiene aproximadamente <strong>{formatRam(deviceInfo.availableRamMb)}</strong> de RAM disponible.
          Los servidores de Minecraft (especialmente Java) pueden cerrarse o ir lentos.
          Se recomienda al menos 2 GB libres para Java y 1 GB para Bedrock.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="!p-1">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
