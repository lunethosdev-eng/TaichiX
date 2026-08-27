import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';
import type { DeviceInfo } from '../types/server';
import ServerNative from '../plugins/ServerNative';

const LOW_RAM_THRESHOLD_MB = 2048;

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    totalRamMb: 4096,
    availableRamMb: 2048,
    model: 'Unknown',
    platform: 'web',
    isLowRam: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const info = await Device.getInfo();
        let totalRam = 4096;
        let availableRam = 2048;

        // Intentar RAM real desde el plugin nativo
        try {
          const mem = await ServerNative.getMemoryInfo();
          if (mem?.totalMb > 0) {
            totalRam = mem.totalMb;
            availableRam = mem.availableMb;
          }
        } catch {
          // @ts-ignore
          if (navigator.deviceMemory) {
            totalRam = Math.round(navigator.deviceMemory * 1024);
            availableRam = Math.round(totalRam * 0.55);
          }
        }

        setDeviceInfo({
          totalRamMb: totalRam,
          availableRamMb: availableRam,
          model: info.model || 'Unknown Device',
          platform: info.platform || 'web',
          isLowRam: availableRam < LOW_RAM_THRESHOLD_MB,
        });
      } catch (e) {
        console.warn('Device info fallback', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { deviceInfo, loading };
}
