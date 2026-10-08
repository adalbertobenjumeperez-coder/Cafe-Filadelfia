import React, { useState } from 'react';
import { OrderItem, OrderType, PaymentMethod } from '../types/cafe';
import { Trash2, Plus, Minus, Send, User, MapPin, CreditCard, Banknote, QrCode, X, Coffee } from 'lucide-react';
import { playTapSound, playOrderSentSound } from '../utils/audio';

interface OrderCartDrawerProps {
  items: OrderItem[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onSubmitOrder: (data: {
    customerName: string;
    type: OrderType;
    tableNumber?: string;
    paymentMethod: PaymentMethod;
    tip: number;
    notes?: string;
  }) => void;
  nextOrderNumber: number;
}

export const OrderCartDrawer: React.FC<OrderCartDrawerProps> = ({
  items,
  isOpenMobile,
  onCloseMobile,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  nextOrderNumber,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('aqui');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [nameError, setNameError] = useState<boolean>(false);

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tipAmount = Math.round((subtotal * tipPercent) / 100);
  const total = subtotal + tipAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    playOrderSentSound();

    onSubmitOrder({
      customerName: customerName.trim(),
      type: orderType,
      tableNumber: orderType === 'aqui' ? tableNumber.trim() : undefined,
      paymentMethod,
      tip: tipAmount,
      notes: customNotes.trim(),
    });

    // Reset state
    setCustomerName('');
    setTableNumber('');
    setCustomNotes('');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Cart Container: Slide-over on mobile, persistent column on desktop */}
      <aside
        className={`fixed lg:static top-0 right-0 bottom-0 z-40 w-full max-w-md lg:max-w-sm bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              #{nextOrderNumber}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Comanda Activa
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {items.length === 0 ? 'Sin productos' : `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onClearCart();
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900"
              aria-label="Cerrar comanda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form & Items Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Customer & Order Type Inputs */}
          <div className="p-4 bg-stone-50/70 dark:bg-stone-850/60 border-b border-stone-100 dark:border-stone-800/80 space-y-3 shrink-0">
            {/* Customer name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Nombre del Cliente *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder="Ej. Sofía, Carlos, Mesa 4..."
                className={`w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border ${
                  nameError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-stone-200 dark:border-stone-700'
                } text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>

            {/* Service Type Segmented Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-stone-200/70 dark:bg-stone-800 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setOrderType('aqui');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  orderType === 'aqui'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Consumir Aquí
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setOrderType('llevar');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  orderType === 'llevar'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Para Llevar 🛍️
              </button>
            </div>

            {/* Optional Table Number if 'aqui' */}
            {orderType === 'aqui' && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="No. de Mesa / Barra (opcional)"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Items Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-300 dark:text-stone-600 mb-3">
                  <Coffee className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  Comanda vacía
                </p>
                <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
                  Toca cualquier café o producto del menú para agregarlo con sus opciones de leche y endulzante.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 space-y-2 relative group"
                >
                  {/* Item Title & Price */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                        ${item.unitPrice.toFixed(2)} c/u
                      </p>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Selected Modifiers Callout */}
                  {item.selectedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[11px] text-stone-600 dark:text-stone-300">
                      {item.selectedOptions.map((opt, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 font-medium inline-flex items-center gap-1"
                        >
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">{opt.choiceName}</span>
                          {opt.price > 0 && (
                            <span className="text-[10px] text-stone-400">(+${opt.price})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Special Notes */}
                  {item.notes && (
                    <p className="text-[11px] italic text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                      Nota: {item.notes}
                    </p>
                  )}

                  {/* Quantity Stepper & Delete */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg transition"
                      title="Eliminar de comanda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-1.5 py-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold tabular-nums w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing & Checkout Section */}
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-md space-y-3 shrink-0">
            {/* Quick Tip Selection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Propina sugerida</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 tabular-nums">
                  ${tipAmount.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {[0, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setTipPercent(pct);
                    }}
                    className={`py-1 rounded-lg border text-center transition ${
                      tipPercent === pct
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    {pct === 0 ? '0%' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setPaymentMethod('efectivo');
                }}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === 'efectivo'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setPaymentMethod('tarjeta');
                }}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === 'tarjeta'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setPaymentMethod('transferencia');
                }}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === 'transferencia'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-bold'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Transf.</span>
              </button>
            </div>

            {/* Total Row */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block">Total a Cobrar</span>
                <span className="text-xs text-stone-400">Subtotal: ${subtotal.toFixed(2)}</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            {/* Send to Barista CTA */}
            <button
              type="submit"
              disabled={items.length === 0}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 active:scale-[0.98] transition"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Barra (Ticket #{nextOrderNumber})</span>
            </button>
          </div>
        </form>
      </aside>
    </>
  );
};
