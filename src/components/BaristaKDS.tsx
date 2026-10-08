import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types/cafe';
import { Clock, CheckCircle, Coffee, Check, Search, AlertCircle, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';
import { playTapSound, playOrderReadySound } from '../utils/audio';

interface BaristaKDSProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const BaristaKDS: React.FC<BaristaKDSProps> = ({ orders, onUpdateOrderStatus }) => {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Update elapsed time every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedTimeText = (createdAt: number) => {
    const minutes = Math.floor((currentTime - createdAt) / 60000);
    if (minutes < 1) return 'Recién pedido';
    if (minutes === 1) return 'Hace 1 min';
    return `Hace ${minutes} mins`;
  };

  const getUrgencyColor = (createdAt: number, status: OrderStatus) => {
    if (status === 'entregado' || status === 'cancelado') return 'text-stone-400';
    const minutes = Math.floor((currentTime - createdAt) / 60000);
    if (minutes >= 10) return 'text-rose-600 dark:text-rose-400 font-bold';
    if (minutes >= 6) return 'text-amber-600 dark:text-amber-400 font-bold';
    return 'text-stone-500 dark:text-stone-400';
  };

  const activeOrders = orders.filter((o) => {
    if (filterStatus !== 'todos' && o.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchNumber = String(o.orderNumber).includes(q);
      return matchName || matchNumber;
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'pendiente').length;
  const preparingCount = orders.filter((o) => o.status === 'preparando').length;
  const readyCount = orders.filter((o) => o.status === 'listo').length;

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    playTapSound();
    if (nextStatus === 'listo' && audioEnabled) {
      playOrderReadySound();
    }
    onUpdateOrderStatus(orderId, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-200/80 dark:bg-stone-850 rounded-2xl no-scrollbar">
          <button
            onClick={() => {
              playTapSound();
              setFilterStatus('todos');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              filterStatus === 'todos'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Activos ({orders.filter((o) => o.status !== 'entregado').length})
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilterStatus('pendiente');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
              filterStatus === 'pendiente'
                ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>Pendientes</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-stone-900 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilterStatus('preparando');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
              filterStatus === 'preparando'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>En Preparación</span>
            {preparingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-blue-800 text-[10px] flex items-center justify-center font-bold">
                {preparingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilterStatus('listo');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
              filterStatus === 'listo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>Listos ({readyCount})</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilterStatus('entregado');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              filterStatus === 'entregado'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Entregados
          </button>
        </div>

        {/* Search & Audio Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente o ticket..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-xl border transition ${
              audioEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'
            }`}
            title={audioEnabled ? 'Sonidos de barra activados' : 'Sonidos desactivados'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grid of Kitchen Tickets */}
      {activeOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Coffee className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-stone-800 dark:text-stone-200">
            No hay comandas activas en este filtro
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Los pedidos tomados en el menú aparecerán aquí instantáneamente para los baristas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map((order) => {
            const isPending = order.status === 'pendiente';
            const isPreparing = order.status === 'preparando';
            const isReady = order.status === 'listo';
            const isDone = order.status === 'entregado';

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-3xl border transition-all shadow-sm ${
                  isPending
                    ? 'bg-amber-50/40 dark:bg-stone-900 border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/20'
                    : isPreparing
                    ? 'bg-blue-50/30 dark:bg-stone-900 border-blue-300 dark:border-blue-800/80 ring-1 ring-blue-400/20'
                    : isReady
                    ? 'bg-emerald-50/30 dark:bg-stone-900 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-400/20'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-60'
                }`}
              >
                {/* Ticket Top Info */}
                <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                          order.type === 'llevar'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {order.type === 'llevar' ? 'Para Llevar' : order.tableNumber ? `Mesa ${order.tableNumber}` : 'En Barra'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-400 text-stone-950 animate-pulse'
                          : isPreparing
                          ? 'bg-blue-600 text-white'
                          : isReady
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {isPending && <Clock className="w-3 h-3" />}
                      {isPreparing && <Coffee className="w-3 h-3" />}
                      {isReady && <Check className="w-3 h-3" />}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </div>

                  {/* Customer Name & Time elapsed */}
                  <div className="mt-2 flex items-baseline justify-between">
                    <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                      {order.customerName}
                    </h4>
                    <span className={`text-xs ${getUrgencyColor(order.createdAt, order.status)} tabular-nums`}>
                      {getElapsedTimeText(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Items & Coffee Customizations list (Super clear for Barista) */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto max-h-[340px] no-scrollbar">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 space-y-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs flex items-center justify-center font-bold">
                            {item.quantity}x
                          </span>
                          <span>{item.productName}</span>
                        </span>
                      </div>

                      {/* Barista Customization Highlights */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="space-y-1">
                          {item.selectedOptions.map((opt, optIdx) => {
                            const isMilk = opt.groupName.toLowerCase().includes('leche');
                            const isSweetener = opt.groupName.toLowerCase().includes('endulz');

                            return (
                              <div
                                key={optIdx}
                                className={`text-xs px-2.5 py-1 rounded-xl flex items-center justify-between font-medium ${
                                  isMilk
                                    ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800/60'
                                    : isSweetener
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 font-bold border border-rose-200/80 dark:border-rose-900/60'
                                    : 'bg-stone-100 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300'
                                }`}
                              >
                                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                                  {opt.groupName}:
                                </span>
                                <span className="font-bold">{opt.choiceName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Barista Notes */}
                      {item.notes && (
                        <div className="p-2 rounded-xl bg-yellow-100/70 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800 text-[11px] font-semibold text-yellow-900 dark:text-yellow-200">
                          ⚠️ Nota: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* General Order Notes */}
                  {order.notes && (
                    <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 italic">
                      Nota general: {order.notes}
                    </div>
                  )}
                </div>

                {/* Barista Action Footer */}
                <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-850/80 border-t border-stone-100 dark:border-stone-800/80 rounded-b-3xl">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'preparando')}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Empezar a Preparar</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'listo')}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Marcar como Listo 🔔</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'entregado')}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Entregado al Cliente</span>
                    </button>
                  )}

                  {isDone && (
                    <div className="text-center text-xs text-stone-400 font-medium py-1">
                      Comanda concluida y entregada
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
