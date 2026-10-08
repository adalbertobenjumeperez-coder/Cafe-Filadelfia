import React from 'react';
import { ActiveTab } from '../types/cafe';
import { Coffee, ClipboardList, Settings, TrendingUp, Smartphone, ShoppingBag } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingOrdersCount: number;
  cartItemsCount: number;
  cartTotal: number;
  onOpenCartMobile: () => void;
  onOpenInstallGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  pendingOrdersCount,
  cartItemsCount,
  cartTotal,
  onOpenCartMobile,
  onOpenInstallGuide,
}) => {
  const handleNav = (tab: ActiveTab) => {
    playTapSound();
    onTabChange(tab);
  };

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 text-stone-100 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-inner">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base sm:text-lg tracking-tight leading-none text-stone-100">
              CaféBarista
            </h1>
            <p className="text-[11px] text-stone-400 font-medium tracking-wide">Punto de Venta iOS</p>
          </div>
        </div>

        {/* Zone 2: Segmented Navigation (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center p-1 bg-stone-800/80 rounded-2xl border border-stone-700/60 text-sm">
          <button
            onClick={() => handleNav('pos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'pos'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Tomar Pedidos</span>
          </button>

          <button
            onClick={() => handleNav('kds')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all relative ${
              activeTab === 'kds'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Barista / Cocina</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-400 text-stone-950 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNav('menu')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Gestión de Menú</span>
          </button>

          <button
            onClick={() => handleNav('ventas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'ventas'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ventas</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Cart Trigger */}
          {activeTab === 'pos' && (
            <button
              onClick={onOpenCartMobile}
              className="lg:hidden relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-md active:scale-95 transition"
              aria-label="Ver comanda"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>${cartTotal.toFixed(2)}</span>
              {cartItemsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-amber-900 text-[11px] font-bold flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          )}

          {/* iOS Install Guide Trigger */}
          <button
            onClick={onOpenInstallGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition active:scale-95 whitespace-nowrap"
            title="Instrucciones para instalar en pantalla de inicio de iPhone / iPad"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Instalar en iOS</span>
            <span className="sm:hidden">App iOS</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (iOS style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-xl border-t border-stone-800 grid grid-cols-4 items-center h-16 pb-safe">
        <button
          onClick={() => handleNav('pos')}
          className={`flex flex-col items-center justify-center h-full transition ${
            activeTab === 'pos' ? 'text-amber-500 font-semibold' : 'text-stone-400'
          }`}
        >
          <Coffee className="w-5 h-5" />
          <span className="text-[10px] mt-1">Menú / POS</span>
        </button>

        <button
          onClick={() => handleNav('kds')}
          className={`flex flex-col items-center justify-center h-full relative transition ${
            activeTab === 'kds' ? 'text-amber-500 font-semibold' : 'text-stone-400'
          }`}
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 text-[9px] font-bold bg-amber-500 text-stone-950 rounded-full flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Barista</span>
        </button>

        <button
          onClick={() => handleNav('menu')}
          className={`flex flex-col items-center justify-center h-full transition ${
            activeTab === 'menu' ? 'text-amber-500 font-semibold' : 'text-stone-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">Menú</span>
        </button>

        <button
          onClick={() => handleNav('ventas')}
          className={`flex flex-col items-center justify-center h-full transition ${
            activeTab === 'ventas' ? 'text-amber-500 font-semibold' : 'text-stone-400'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] mt-1">Ventas</span>
        </button>
      </div>
    </header>
  );
};
