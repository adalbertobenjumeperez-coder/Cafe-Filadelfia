import React, { useState } from 'react';
import { Order } from '../types/cafe';
import { TrendingUp, DollarSign, ShoppingCart, Award, FileText, CheckCircle2 } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface SalesAnalyticsProps {
  orders: Order[];
  onViewReceipt: (order: Order) => void;
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ orders, onViewReceipt }) => {
  const [filterPeriod, setFilterPeriod] = useState<'hoy' | 'todos'>('todos');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const filteredOrders = orders.filter((o) => {
    if (filterPeriod === 'hoy') {
      return o.createdAt >= startOfToday;
    }
    return true;
  });

  const validOrders = filteredOrders.filter((o) => o.status !== 'cancelado');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = validOrders.length;
  const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Compute product sales counts
  const productCountMap: Record<string, number> = {};
  const milkCountMap: Record<string, number> = {};
  const sweetenerCountMap: Record<string, number> = {};

  validOrders.forEach((order) => {
    order.items.forEach((item) => {
      productCountMap[item.productName] = (productCountMap[item.productName] || 0) + item.quantity;

      item.selectedOptions?.forEach((opt) => {
        if (opt.groupName.toLowerCase().includes('leche')) {
          milkCountMap[opt.choiceName] = (milkCountMap[opt.choiceName] || 0) + item.quantity;
        }
        if (opt.groupName.toLowerCase().includes('endulz')) {
          sweetenerCountMap[opt.choiceName] = (sweetenerCountMap[opt.choiceName] || 0) + item.quantity;
        }
      });
    });
  });

  const topProducts = Object.entries(productCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topMilks = Object.entries(milkCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topSweeteners = Object.entries(sweetenerCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Métricas de Venta y Preferencias
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Analiza qué cafés, tipos de leche y endulzantes son los más solicitados por tus clientes.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              playTapSound();
              setFilterPeriod('hoy');
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterPeriod === 'hoy'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterPeriod('todos');
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterPeriod === 'todos'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Histórico Total
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold mb-2">
            <span>Ingresos Totales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
            ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Ventas brutas acumuladas</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold mb-2">
            <span>Comandas Realizadas</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
            {totalOrdersCount}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Pedidos registrados</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold mb-2">
            <span>Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
            ${avgTicket.toFixed(2)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Gasto medio por cliente</p>
        </div>
      </div>

      {/* Breakdowns: Top Products & Milk Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top Coffees */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Cafés Más Vendidos</span>
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">No hay datos suficientes aún</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[190px]">
                    {idx + 1}. {name}
                  </span>
                  <span className="font-bold tabular-nums bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg">
                    {count} servidos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Milks (Very useful for inventory planning!) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>🥛</span>
            <span>Preferencia de Leches</span>
          </h3>
          {topMilks.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">No hay datos suficientes aún</p>
          ) : (
            <div className="space-y-2">
              {topMilks.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[190px]">{name}</span>
                  <span className="font-bold tabular-nums bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                    {count} tazas
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Sweeteners */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>🍯</span>
            <span>Preferencia de Endulzantes</span>
          </h3>
          {topSweeteners.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">No hay datos suficientes aún</p>
          ) : (
            <div className="space-y-2">
              {topSweeteners.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[190px]">{name}</span>
                  <span className="font-bold tabular-nums bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-lg">
                    {count} pedidos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders History Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            Historial de Comandas Registradas
          </h3>
          <span className="text-xs text-stone-400">{filteredOrders.length} tickets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-850 text-stone-500 font-semibold border-b border-stone-100 dark:border-stone-800">
              <tr>
                <th className="p-3.5">Ticket #</th>
                <th className="p-3.5">Hora</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Productos & Personalización</th>
                <th className="p-3.5">Método</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No se han registrado pedidos en este periodo.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-850/40 transition">
                    <td className="p-3.5 font-bold tabular-nums">#{order.orderNumber}</td>
                    <td className="p-3.5 text-stone-500 tabular-nums">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-semibold text-stone-900 dark:text-stone-100">
                      {order.customerName}
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize text-stone-500">
                        {order.type === 'llevar' ? 'Para Llevar' : 'En Mesa'}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-[280px]">
                      <div className="space-y-0.5">
                        {order.items.map((it, i) => (
                          <div key={i} className="truncate text-[11px] text-stone-600 dark:text-stone-300">
                            <span className="font-semibold">{it.quantity}x {it.productName}</span>
                            {it.selectedOptions && it.selectedOptions.length > 0 && (
                              <span className="text-stone-400">
                                {' '}
                                ({it.selectedOptions.map((o) => o.choiceName).join(', ')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 capitalize text-stone-500">{order.paymentMethod}</td>
                    <td className="p-3.5 font-bold tabular-nums text-stone-900 dark:text-stone-100">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          playTapSound();
                          onViewReceipt(order);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Ticket</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
