import React from 'react';
import { Share, PlusSquare, Smartphone, X, CheckCircle2 } from 'lucide-react';

interface IOSInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-950 flex items-center justify-center text-amber-100 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Instalar en tu iPhone o iPad</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Úsalo como app nativa a pantalla completa</p>
          </div>
        </div>

        <div className="space-y-4 my-6 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-100">1. Abre en Safari y toca Compartir</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">En la barra inferior de Safari, toca el botón de compartir (el cuadrado con la flecha hacia arriba).</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-100">2. "Agregar a pantalla de inicio"</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Desliza hacia abajo en las opciones de compartir y selecciona esta opción.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-100">3. ¡Listo para tu cafetería!</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">La app se abrirá sin barras del navegador, con máxima velocidad para tomar pedidos.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-2xl bg-amber-900 hover:bg-amber-950 text-white font-medium text-sm transition active:scale-[0.98] shadow-lg shadow-amber-900/20"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
