import React from 'react';
import { Order } from '../types/cafe';
import { X, Printer, Check, Coffee } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white text-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 relative flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 transition"
          aria-label="Cerrar ticket"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Receipt Header */}
        <div className="text-center border-b border-dashed border-stone-300 pb-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center mx-auto mb-2">
            <Coffee className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base tracking-tight uppercase">CaféBarista Artesanal</h3>
          <p className="text-[11px] text-stone-500">Ticket de Venta Digital</p>
          <div className="mt-2 text-xs flex justify-between text-stone-600">
            <span>Orden: #{order.orderNumber}</span>
            <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-xs text-left text-stone-600 mt-0.5">
            Cliente: <span className="font-bold text-stone-900">{order.customerName}</span>
            {order.type === 'llevar' ? ' (Para Llevar)' : order.tableNumber ? ` (Mesa ${order.tableNumber})` : ' (En Barra)'}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] text-xs border-b border-dashed border-stone-300 pb-4 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>{item.quantity}x {item.productName}</span>
                <span className="tabular-nums">${item.totalPrice.toFixed(2)}</span>
              </div>
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <div className="pl-3 text-[10px] text-stone-600 space-y-0.5">
                  {item.selectedOptions.map((opt, i) => (
                    <div key={i} className="flex justify-between">
                      <span>• {opt.choiceName}</span>
                      {opt.price > 0 && <span>+${opt.price}</span>}
                    </div>
                  ))}
                </div>
              )}
              {item.notes && (
                <div className="pl-3 text-[10px] italic text-stone-500">
                  Nota: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal:</span>
            <span className="tabular-nums">${order.subtotal.toFixed(2)}</span>
          </div>
          {order.tip > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Propina:</span>
              <span className="tabular-nums">${order.tip.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
            <span>TOTAL:</span>
            <span className="tabular-nums">${order.total.toFixed(2)}</span>
          </div>
          <div className="text-[10px] text-stone-500 pt-1">
            Método: <span className="capitalize font-semibold">{order.paymentMethod}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 font-sans pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
