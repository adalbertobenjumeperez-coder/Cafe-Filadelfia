import React, { useState, useEffect } from 'react';
import { Product, OptionGroup, SelectedOption, OrderItem } from '../types/cafe';
import { X, Check, Plus, Minus, MessageSquare, Sparkles } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface CustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Initialize defaults whenever product changes
  useEffect(() => {
    if (!product) return;
    const initial: Record<string, string[]> = {};

    product.optionGroups?.forEach((group) => {
      const defaultChoice = group.choices.find((c) => c.isDefault) || group.choices[0];
      if (group.required && defaultChoice) {
        initial[group.id] = [defaultChoice.id];
      } else {
        const defaults = group.choices.filter((c) => c.isDefault).map((c) => c.id);
        initial[group.id] = defaults;
      }
    });

    setSelectedChoices(initial);
    setNotes('');
    setQuantity(1);
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSelectChoice = (group: OptionGroup, choiceId: string) => {
    playTapSound();
    const isSingle = (group.maxSelect ?? 1) === 1;

    setSelectedChoices((prev) => {
      const current = prev[group.id] || [];
      if (isSingle) {
        // If required, always replace. If optional and already selected, deselect.
        if (group.required) {
          return { ...prev, [group.id]: [choiceId] };
        } else {
          return {
            ...prev,
            [group.id]: current.includes(choiceId) ? [] : [choiceId],
          };
        }
      } else {
        // Multi-select
        if (current.includes(choiceId)) {
          return {
            ...prev,
            [group.id]: current.filter((id) => id !== choiceId),
          };
        } else {
          const max = group.maxSelect || 99;
          if (current.length >= max) {
            // Replace the oldest or prevent
            return {
              ...prev,
              [group.id]: [...current.slice(1), choiceId],
            };
          }
          return {
            ...prev,
            [group.id]: [...current, choiceId],
          };
        }
      }
    });
  };

  // Calculate live unit price
  let optionsPriceSum = 0;
  const flatSelectedOptions: SelectedOption[] = [];

  product.optionGroups?.forEach((group) => {
    const chosenIds = selectedChoices[group.id] || [];
    chosenIds.forEach((cId) => {
      const choice = group.choices.find((c) => c.id === cId);
      if (choice) {
        optionsPriceSum += choice.price;
        flatSelectedOptions.push({
          groupId: group.id,
          groupName: group.name,
          choiceId: choice.id,
          choiceName: choice.name,
          price: choice.price,
        });
      }
    });
  });

  const unitPrice = Math.max(0, product.basePrice + optionsPriceSum);
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    playTapSound();
    const orderItem: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      selectedOptions: flatSelectedOptions,
      notes: notes.trim(),
      unitPrice,
      quantity,
      totalPrice,
    };
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-stone-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Drag Handle on top */}
        <div className="w-10 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800/80 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {product.category}
              </span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Base: ${product.basePrice.toFixed(2)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
              {product.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
            aria-label="Cerrar personalización"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar">
          {product.optionGroups && product.optionGroups.length > 0 ? (
            product.optionGroups.map((group) => {
              const selectedInGroup = selectedChoices[group.id] || [];
              const isSingle = (group.maxSelect ?? 1) === 1;

              return (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>{group.name}</span>
                      {group.required ? (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                          Obligatorio
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          (Opcional)
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {isSingle ? 'Elige 1' : `Hasta ${group.maxSelect || group.choices.length}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.choices.map((choice) => {
                      const isSelected = selectedInGroup.includes(choice.id);

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleSelectChoice(group, choice.id)}
                          className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 font-semibold shadow-xs ring-1 ring-amber-600/30'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? 'border-amber-600 bg-amber-600 text-white'
                                  : 'border-stone-300 dark:border-stone-600'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-sm truncate">
                              {choice.name}
                            </span>
                          </div>

                          <span
                            className={`text-xs tabular-nums shrink-0 font-medium ${
                              choice.price > 0
                                ? 'text-amber-700 dark:text-amber-400'
                                : choice.price < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {choice.price > 0
                              ? `+$${choice.price.toFixed(2)}`
                              : choice.price < 0
                              ? `-$${Math.abs(choice.price).toFixed(2)}`
                              : 'Incluido'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-stone-400">
              Este producto no tiene opciones de personalización adicionales.
            </div>
          )}

          {/* Special Barista Notes */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Instrucciones especiales para Barista</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. En taza de cerámica propia, tibio, poca espuma..."
              className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Modal Sticky Bottom Bar */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 backdrop-blur-md shrink-0 flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setQuantity((q) => Math.max(1, q - 1));
              }}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none transition"
              aria-label="Restar cantidad"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-bold text-sm sm:text-base tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setQuantity((q) => q + 1);
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
              aria-label="Sumar cantidad"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 min-h-[48px] px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-amber-600/25 active:scale-[0.98] transition"
          >
            <span>Agregar al Pedido</span>
            <span className="tabular-nums font-extrabold bg-amber-700/60 px-2.5 py-1 rounded-xl">
              ${totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
