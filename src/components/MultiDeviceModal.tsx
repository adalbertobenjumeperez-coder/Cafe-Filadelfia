import React, { useState } from 'react';
import { X, Tablet, Laptop, Smartphone, Check, Copy, Wifi, ArrowRightLeft, Sparkles } from 'lucide-react';
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

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    playTapSound();
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative"
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
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
              Conecta meseros (tablets/teléfonos) y baristas (computadora) en tiempo real
            </p>
          </div>
        </div>

        {/* Diagram */}
        <div className="my-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-white dark:bg-stone-800 shadow-xs">
              <Tablet className="w-6 h-6 text-amber-600 mb-1" />
              <span className="font-bold text-stone-900 dark:text-stone-100">Tablet / Celular</span>
              <span className="text-[10px] text-stone-500">Mesero toma la orden</span>
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
                Servidor en vivo
              </span>
            </div>

            <div className="flex flex-col items-center p-2.5 rounded-xl bg-white dark:bg-stone-800 shadow-xs">
              <Laptop className="w-6 h-6 text-blue-600 mb-1" />
              <span className="font-bold text-stone-900 dark:text-stone-100">Computadora</span>
              <span className="text-[10px] text-stone-500">Barista ve comanda</span>
            </div>
          </div>
        </div>

        {/* How to use */}
        <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
          <p className="font-semibold text-stone-900 dark:text-stone-100">
            ¿Cómo conectar tus dispositivos ahora mismo?
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>
              Abre este mismo enlace en el <strong>navegador de tu teléfono o tablet</strong> y en tu <strong>computadora</strong>.
            </li>
            <li>
              En la <strong>tablet</strong>, selecciona la pestaña <span className="font-semibold text-amber-600">"Tomar Pedidos"</span> para registrar clientes.
            </li>
            <li>
              En la <strong>computadora o pantalla de barra</strong>, mantén abierta la pestaña <span className="font-semibold text-amber-600">"Barista / Cocina"</span>.
            </li>
            <li>
              Cuando el mesero presione <span className="font-semibold">"Enviar a Barra"</span>, ¡la orden aparecerá automáticamente en la computadora en menos de 1 segundo con su sonido de timbre!
            </li>
          </ol>
        </div>

        {/* URL Sharing */}
        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
          <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
            Enlace de tu cafetería para abrir en otros dispositivos:
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
              className="min-h-[40px] px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
