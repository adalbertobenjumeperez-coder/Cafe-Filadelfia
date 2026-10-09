import React, { useState, useEffect } from 'react';
import { X, Tablet, Laptop, Check, Copy, Wifi, ArrowRightLeft, Server, AlertTriangle, RefreshCw } from 'lucide-react';
import { syncClient, DEFAULT_CLOUD_SERVER_URL } from '../utils/syncClient';
import { playTapSound } from '../utils/audio';

interface MultiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: 'conectando' | 'conectado' | 'desconectado';
}

export const MultiDeviceModal: React.FC<MultiDeviceModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'exito' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = syncClient.getServerBaseUrl();
      setServerUrlInput(current || (typeof window !== 'undefined' && window.location.hostname.includes('github.io') ? DEFAULT_CLOUD_SERVER_URL : ''));
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

  const handleCopy = () => {
    playTapSound();
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveServer = async () => {
    playTapSound();
    setIsTesting(true);
    setTestResult(null);

    const targetUrl = serverUrlInput.trim();
    if (targetUrl) {
      const ok = await syncClient.testServerConnection(targetUrl);
      setIsTesting(false);
      if (ok) {
        setTestResult('exito');
        syncClient.setServerBaseUrl(targetUrl);
      } else {
        setTestResult('error');
        // Still save it if user wants to force
        syncClient.setServerBaseUrl(targetUrl);
      }
    } else {
      setIsTesting(false);
      syncClient.setServerBaseUrl('');
      setTestResult('exito');
    }
  };

  const handleUseDefaultCloudServer = () => {
    playTapSound();
    setServerUrlInput(DEFAULT_CLOUD_SERVER_URL);
    syncClient.setServerBaseUrl(DEFAULT_CLOUD_SERVER_URL);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold">Sincronización Multidispositivo</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  connectionStatus === 'conectado'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : connectionStatus === 'conectando'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connectionStatus === 'conectado'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus === 'conectando'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="capitalize">{connectionStatus}</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Conecta meseros (tablet/celular) y baristas (computadora) en tiempo real
            </p>
          </div>
        </div>

        {/* GitHub Pages Notice */}
        {isGitHubPages && (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Detectado: Alojamiento en GitHub Pages</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
              GitHub Pages solo guarda archivos estáticos (HTML/JS) y no ejecuta código backend. Para que tus pedidos se sincronicen entre el celular del mesero y la laptop del barista, la app se conecta al servidor central en la nube.
            </p>
          </div>
        )}

        {/* Diagram */}
        <div className="my-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center p-2 rounded-xl bg-white dark:bg-stone-800 shadow-xs">
              <Tablet className="w-5 h-5 text-amber-600 mb-1" />
              <span className="font-bold text-stone-900 dark:text-stone-100 text-[11px]">Tablet Mesero</span>
              <span className="text-[10px] text-stone-500">Toma pedidos</span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-center">
                <div className="h-0.5 flex-1 bg-amber-400/60" />
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <div className="h-0.5 flex-1 bg-amber-400/60" />
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Tiempo Real
              </span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-white dark:bg-stone-800 shadow-xs">
              <Laptop className="w-5 h-5 text-blue-600 mb-1" />
              <span className="font-bold text-stone-900 dark:text-stone-100 text-[11px]">PC Barista</span>
              <span className="text-[10px] text-stone-500">Comanda en vivo</span>
            </div>
          </div>
        </div>

        {/* Server URL Configuration */}
        <div className="my-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-600" />
              <span>Servidor Central de Sincronización</span>
            </label>
            <button
              type="button"
              onClick={handleUseDefaultCloudServer}
              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              Restablecer Servidor Nube
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="https://..."
              className="flex-1 h-10 px-3 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleSaveServer}
              disabled={isTesting}
              className="min-h-[40px] px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isTesting ? 'Probando...' : 'Conectar'}</span>
            </button>
          </div>

          {testResult === 'exito' && (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>¡Conexión establecida exitosamente con el servidor central!</span>
            </p>
          )}

          {testResult === 'error' && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              No se pudo conectar a esta URL. Verifica que el servidor esté activo o pulsa "Restablecer Servidor Nube".
            </p>
          )}
        </div>

        {/* Current URL to open on other devices */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
          <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
            Enlace para abrir en tus otros dispositivos (tablet, celular o PC):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 h-10 px-3 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-700 dark:text-stone-300 select-all"
            />
            <button
              onClick={handleCopy}
              className="min-h-[40px] px-3.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition active:scale-98 shadow-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
