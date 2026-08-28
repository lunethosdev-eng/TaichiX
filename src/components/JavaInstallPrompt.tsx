import React from 'react';
import { TermuxJavaInstaller } from '../plugins/TermuxJavaInstaller';

interface JavaInstallPromptProps {
  serverId?: string;
  onClose: () => void;
}

/**
 * Modal que solicita instalar Java si no está disponible
 * Facilita la instalación automática via Termux
 */
export function JavaInstallPrompt({
  onClose,
}: JavaInstallPromptProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleInstallJava = async () => {
    setLoading(true);
    try {
      await TermuxJavaInstaller.installJavaInTermux();
    } catch (err) {
      setError(
        'No se pudo abrir Termux. Asegúrate de que esté instalado desde Google Play'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualInstall = () => {
    const instructions = TermuxJavaInstaller.getDetailedInstructions();
    alert(instructions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full border border-cyan-500">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">
          ☕ Java Runtime Requerido
        </h2>

        <p className="text-gray-300 mb-4">
          No se detectó Java (JRE) en tu teléfono. Para ejecutar servidores Java,
          necesitas instalarlo primero.
        </p>

        <p className="text-green-400 text-sm mb-4">
          ✅ Detectamos que tienes Termux instalado. ¡Perfecto!
        </p>

        <button
          onClick={handleInstallJava}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded mb-3 transition disabled:opacity-50"
        >
          {loading ? 'Abriendo Termux...' : '📱 Instalar Java en Termux'}
        </button>

        <button
          onClick={handleManualInstall}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mb-3 transition"
        >
          📋 Ver Instrucciones Manuales
        </button>

        {error && (
          <div className="bg-red-900 border border-red-500 text-red-200 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          ✕ Cerrar
        </button>

        <p className="text-gray-500 text-xs mt-4 text-center">
          Después de instalar Java, vuelve a TaichiX e intenta crear el servidor
          nuevamente.
        </p>
      </div>
    </div>
  );
}
