import React from 'react';
import { Product } from '../types/cafe';
import { Plus, SlidersHorizontal, Check } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface ProductCardProps {
  product: Product;
  onCustomize: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onCustomize,
  onQuickAdd,
}) => {
  const hasOptions = product.optionGroups && product.optionGroups.length > 0;

  const handleCardClick = () => {
    playTapSound();
    onCustomize(product);
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    onQuickAdd(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer text-left ${
        !product.available ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div>
        {/* Header row: category tag & price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
            {product.category}
          </span>
          <span className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 tabular-nums">
            ${product.basePrice.toFixed(2)}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Options summary metadata */}
        {hasOptions && (
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap gap-1 text-[11px] text-stone-500 dark:text-stone-400">
            {product.optionGroups.map((grp, idx) => (
              <span key={grp.id} className="inline-flex items-center">
                <span>{grp.name}</span>
                {idx < product.optionGroups.length - 1 && <span className="mx-1 text-stone-300 dark:text-stone-700">·</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons row */}
      <div className="mt-4 pt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCardClick}
          className="flex-1 min-h-[44px] px-3 rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Personalizar</span>
        </button>

        <button
          type="button"
          onClick={handleQuickAddClick}
          className="min-h-[44px] min-w-[44px] px-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition"
          title="Agregar directo con opciones estándar"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Rápido</span>
        </button>
      </div>
    </div>
  );
};
