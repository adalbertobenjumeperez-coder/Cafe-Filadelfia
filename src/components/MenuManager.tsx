import React, { useState } from 'react';
import { Product, OptionGroup, OptionChoice } from '../types/cafe';
import { DEFAULT_OPTION_TEMPLATES } from '../data/initialData';
import { Plus, Edit2, Trash2, Check, X, Sparkles, SlidersHorizontal, RefreshCw, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface MenuManagerProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  onResetDefaults: () => void;
  onExportData: () => void;
  onImportData: (json: string) => boolean | Promise<boolean>;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  products,
  onSaveProducts,
  onResetDefaults,
  onExportData,
  onImportData,
}) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');

  // Form state
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Cafés Clásicos');
  const [formNewCategoryInput, setFormNewCategoryInput] = useState<string>('');
  const [formBasePrice, setFormBasePrice] = useState<number>(50);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formOptionGroups, setFormOptionGroups] = useState<OptionGroup[]>([]);
  const [formAvailable, setFormAvailable] = useState<boolean>(true);

  // Categories list
  const existingCategories = Array.from(new Set(products.map((p) => p.category)));

  const openNewProductForm = () => {
    playTapSound();
    setIsCreatingNew(true);
    setEditingProduct(null);
    setFormName('');
    setFormCategory(existingCategories[0] || 'Cafés Clásicos');
    setFormNewCategoryInput('');
    setFormBasePrice(50);
    setFormDescription('');
    // Pre-populate with typical coffee options for convenience
    setFormOptionGroups([
      JSON.parse(JSON.stringify(DEFAULT_OPTION_TEMPLATES[0])), // Leche
      JSON.parse(JSON.stringify(DEFAULT_OPTION_TEMPLATES[1])), // Endulzante
    ]);
    setFormAvailable(true);
  };

  const openEditProductForm = (product: Product) => {
    playTapSound();
    setIsCreatingNew(false);
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormNewCategoryInput('');
    setFormBasePrice(product.basePrice);
    setFormDescription(product.description);
    setFormOptionGroups(JSON.parse(JSON.stringify(product.optionGroups || [])));
    setFormAvailable(product.available);
  };

  const closeForm = () => {
    setEditingProduct(null);
    setIsCreatingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const finalCategory = formNewCategoryInput.trim() || formCategory;
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: formName.trim(),
      category: finalCategory,
      basePrice: Number(formBasePrice) || 0,
      description: formDescription.trim(),
      available: formAvailable,
      optionGroups: formOptionGroups,
    };

    let updated: Product[];
    if (editingProduct) {
      updated = products.map((p) => (p.id === editingProduct.id ? newProduct : p));
    } else {
      updated = [newProduct, ...products];
    }

    onSaveProducts(updated);
    playTapSound();
    closeForm();
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este producto del menú?')) {
      playTapSound();
      const updated = products.filter((p) => p.id !== productId);
      onSaveProducts(updated);
    }
  };

  const handleToggleAvailable = (product: Product) => {
    playTapSound();
    const updated = products.map((p) =>
      p.id === product.id ? { ...p, available: !p.available } : p
    );
    onSaveProducts(updated);
  };

  // Option Groups management inside the form
  const handleAddTemplateGroup = (templateIndex: number) => {
    const template = DEFAULT_OPTION_TEMPLATES[templateIndex];
    if (!template) return;
    const cloned: OptionGroup = {
      ...JSON.parse(JSON.stringify(template)),
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    setFormOptionGroups([...formOptionGroups, cloned]);
    playTapSound();
  };

  const handleAddNewCustomGroup = () => {
    const newGroup: OptionGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: 'Nueva Opción (ej. Tipo de Grano o Siropes)',
      required: true,
      maxSelect: 1,
      choices: [
        { id: `ch-${Date.now()}-1`, name: 'Opción Estándar', price: 0, isDefault: true },
        { id: `ch-${Date.now()}-2`, name: 'Opción Especial', price: 10 },
      ],
    };
    setFormOptionGroups([...formOptionGroups, newGroup]);
    playTapSound();
  };

  const handleRemoveGroup = (groupId: string) => {
    setFormOptionGroups(formOptionGroups.filter((g) => g.id !== groupId));
    playTapSound();
  };

  const handleAddChoiceToGroup = (groupId: string) => {
    setFormOptionGroups(
      formOptionGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newChoice: OptionChoice = {
          id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Nueva Variante',
          price: 0,
        };
        return { ...g, choices: [...g.choices, newChoice] };
      })
    );
    playTapSound();
  };

  const handleRemoveChoiceFromGroup = (groupId: string, choiceId: string) => {
    setFormOptionGroups(
      formOptionGroups.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, choices: g.choices.filter((c) => c.id !== choiceId) };
      })
    );
    playTapSound();
  };

  const handleChoiceFieldChange = (
    groupId: string,
    choiceId: string,
    field: 'name' | 'price' | 'isDefault',
    value: unknown
  ) => {
    setFormOptionGroups(
      formOptionGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          choices: g.choices.map((c) => {
            if (field === 'isDefault' && g.maxSelect === 1) {
              return { ...c, isDefault: c.id === choiceId };
            }
            if (c.id === choiceId) {
              return { ...c, [field]: value };
            }
            return c;
          }),
        };
      })
    );
  };

  // Filter products by category
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter === 'Todos') return true;
    return p.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Administración del Menú y Opciones
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Agrega productos, edita precios y personaliza las opciones de leches, endulzantes y extras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openNewProductForm}
            className="flex-1 sm:flex-none min-h-[44px] px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Producto</span>
          </button>

          <button
            type="button"
            onClick={onExportData}
            className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition"
            title="Exportar respaldo de datos (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Restablecer menú con cafés y opciones iniciales de fábrica?')) {
                onResetDefaults();
              }
            }}
            className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition"
            title="Restaurar menú demo inicial"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-200/80 dark:bg-stone-850 rounded-2xl no-scrollbar">
        <button
          onClick={() => setSelectedCategoryFilter('Todos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            selectedCategoryFilter === 'Todos'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          Todos ({products.length})
        </button>
        {existingCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              selectedCategoryFilter === cat
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {cat} ({products.filter((p) => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Products list table / cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between shadow-xs transition ${
              !product.available ? 'opacity-60 bg-stone-50 dark:bg-stone-950' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {product.category}
                </span>
                <span className="font-extrabold text-base text-stone-900 dark:text-stone-100 tabular-nums">
                  ${product.basePrice.toFixed(2)}
                </span>
              </div>

              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                {product.description}
              </p>

              {/* Option Groups preview */}
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 block">
                  Opciones disponibles ({product.optionGroups?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {product.optionGroups?.map((grp) => (
                    <span
                      key={grp.id}
                      className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-medium text-stone-700 dark:text-stone-300"
                    >
                      {grp.name} ({grp.choices.length})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleToggleAvailable(product)}
                className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
                  product.available
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-stone-300 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                }`}
                title={product.available ? 'Producto activo en menú' : 'Producto pausado'}
              >
                {product.available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{product.available ? 'En Menú' : 'Pausado'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditProductForm(product)}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition"
                  title="Editar producto y opciones"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-stone-500 transition"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Form Modal (iOS Full sheet style) */}
      {(isCreatingNew || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-white dark:bg-stone-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingProduct ? 'Editar Producto y Opciones' : 'Crear Nuevo Producto'}
                </h3>
                <p className="text-xs text-stone-500">
                  Configura el precio base y las opciones de personalización (leches, endulzantes, etc.)
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Nombre del Café / Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Capuchino de Vainilla, Latte de Avena..."
                    className="w-full h-11 px-3.5 text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__nueva__">+ Crear nueva categoría...</option>
                  </select>
                  {formCategory === '__nueva__' && (
                    <input
                      type="text"
                      placeholder="Escribe el nombre de la nueva categoría"
                      value={formNewCategoryInput}
                      onChange={(e) => setFormNewCategoryInput(e.target.value)}
                      className="mt-2 w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-stone-800 border border-amber-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Precio Base ($ MXN) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    className="w-full h-11 px-3.5 text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descripción breve del sabor, tueste o preparación..."
                    className="w-full p-3 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Option Groups Manager Section */}
              <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                      <span>Grupos de Opciones y Variantes</span>
                    </h4>
                    <p className="text-xs text-stone-400">
                      Opciones que el barista o cliente puede personalizar (ej. Tipo de Leche, Endulzante, etc.)
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddTemplateGroup(0)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition"
                    >
                      + Leches
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTemplateGroup(1)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
                    >
                      + Endulzantes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTemplateGroup(2)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold border border-stone-200 dark:border-stone-700 hover:bg-stone-200 transition"
                    >
                      + Tamaños
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewCustomGroup}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold hover:opacity-90 transition"
                    >
                      + Personalizado
                    </button>
                  </div>
                </div>

                {/* List of Option Groups */}
                {formOptionGroups.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-stone-400 text-xs">
                    No has agregado grupos de opciones todavía. Haz clic arriba en "+ Leches" o "+ Endulzantes" para añadir opciones rápidas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formOptionGroups.map((group, grpIdx) => (
                      <div
                        key={group.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3"
                      >
                        {/* Group Header */}
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormOptionGroups(
                                formOptionGroups.map((g) => (g.id === group.id ? { ...g, name: val } : g))
                              );
                            }}
                            className="font-bold text-sm bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
                          />

                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.required}
                                onChange={(e) => {
                                  const req = e.target.checked;
                                  setFormOptionGroups(
                                    formOptionGroups.map((g) => (g.id === group.id ? { ...g, required: req } : g))
                                  );
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>Obligatorio</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRemoveGroup(group.id)}
                              className="p-1 rounded-md text-stone-400 hover:text-rose-600 transition"
                              title="Eliminar grupo completo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Group Choices Table */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-stone-400 block">
                            Opciones de este grupo (Nombre y costo extra):
                          </span>
                          {group.choices.map((choice) => (
                            <div
                              key={choice.id}
                              className="flex items-center gap-2 bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200/60 dark:border-stone-700/60"
                            >
                              <input
                                type="text"
                                value={choice.name}
                                onChange={(e) =>
                                  handleChoiceFieldChange(group.id, choice.id, 'name', e.target.value)
                                }
                                placeholder="Nombre de la opción (ej. Leche Deslactosada)"
                                className="flex-1 h-8 px-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />

                              <div className="flex items-center gap-1 w-28">
                                <span className="text-xs text-stone-400">$</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={choice.price}
                                  onChange={(e) =>
                                    handleChoiceFieldChange(group.id, choice.id, 'price', Number(e.target.value))
                                  }
                                  placeholder="Extra"
                                  className="w-full h-8 px-2 text-xs rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveChoiceFromGroup(group.id, choice.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 rounded transition"
                                title="Eliminar opción"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddChoiceToGroup(group.id)}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 pt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar otra variante a {group.name}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md active:scale-95 transition"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
