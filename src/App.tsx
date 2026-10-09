import React, { useState, useEffect } from 'react';
import { Product, Order, OrderItem, ActiveTab, OrderStatus } from './types/cafe';
import {
  getStoredProducts,
  getStoredOrders,
  exportBackupData,
} from './utils/storage';
import { syncClient } from './utils/syncClient';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CustomizationModal } from './components/CustomizationModal';
import { OrderCartDrawer } from './components/OrderCartDrawer';
import { BaristaKDS } from './components/BaristaKDS';
import { MenuManager } from './components/MenuManager';
import { SalesAnalytics } from './components/SalesAnalytics';
import { IOSInstallGuide } from './components/IOSInstallGuide';
import { MultiDeviceModal } from './components/MultiDeviceModal';
import { ReceiptModal } from './components/ReceiptModal';
import { Search, Sparkles, Coffee } from 'lucide-react';
import { playTapSound, playOrderSentSound, playOrderReadySound } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
  const [isCartMobileOpen, setIsCartMobileOpen] = useState<boolean>(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(false);
  const [isMultiDeviceModalOpen, setIsMultiDeviceModalOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'conectando' | 'conectado' | 'desconectado'>('conectando');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [nextOrderNum, setNextOrderNum] = useState<number>(101);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data and real-time subscription
  useEffect(() => {
    // 1. Initial local fallback
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());

    // 2. Subscribe to connection status
    const unsubStatus = syncClient.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // 3. Subscribe to real-time events from server (all devices)
    const unsubEvents = syncClient.subscribe((event) => {
      if (event.type === 'init' || event.type === 'state:reloaded') {
        if (event.payload.products) setProducts(event.payload.products);
        if (event.payload.orders) setOrders(event.payload.orders);
        if (event.payload.counter) setNextOrderNum(event.payload.counter + 1);
      } else if (event.type === 'order:created') {
        const newOrder = event.payload.order;
        setOrders((prev) => {
          // Idempotency: avoid duplicates
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        if (event.payload.counter) {
          setNextOrderNum(event.payload.counter + 1);
        }
        playOrderSentSound();
        showToast(`🔔 ¡Nueva comanda #${newOrder.orderNumber} recibida! (${newOrder.customerName})`);
      } else if (event.type === 'order:updated') {
        const updated = event.payload.order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        if (updated.status === 'listo') {
          playOrderReadySound();
          showToast(`✅ Pedido #${updated.orderNumber} listo para entrega`);
        }
      } else if (event.type === 'products:updated') {
        setProducts(event.payload.products);
        showToast('Menú sincronizado');
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart operations
  const handleAddToCart = (item: OrderItem) => {
    setCartItems((prev) => [...prev, item]);
    showToast(`Agregado: ${item.quantity}x ${item.productName}`);
  };

  const handleQuickAdd = (product: Product) => {
    const selectedOptions = (product.optionGroups || []).flatMap((group) => {
      const defChoice = group.choices.find((c) => c.isDefault) || group.choices[0];
      if (group.required && defChoice) {
        return [
          {
            groupId: group.id,
            groupName: group.name,
            choiceId: defChoice.id,
            choiceName: defChoice.name,
            price: defChoice.price,
          },
        ];
      }
      return [];
    });

    const optionsExtra = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
    const unitPrice = Math.max(0, product.basePrice + optionsExtra);

    const orderItem: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      selectedOptions,
      unitPrice,
      quantity: 1,
      totalPrice: unitPrice,
    };

    handleAddToCart(orderItem);
  };

  const handleOpenCustomize = (product: Product) => {
    setSelectedProductForModal(product);
    setIsCustomizeOpen(true);
  };

  const handleUpdateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    playTapSound();
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Submit complete order from cart to Barista kitchen (Syncs cross-device!)
  const handleSubmitOrder = async (orderData: {
    customerName: string;
    type: 'aqui' | 'llevar';
    tableNumber?: string;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    tip: number;
    notes?: string;
  }) => {
    const subtotal = cartItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const total = subtotal + orderData.tip;

    const payload: Partial<Order> = {
      customerName: orderData.customerName,
      type: orderData.type,
      tableNumber: orderData.tableNumber,
      status: 'pendiente',
      items: [...cartItems],
      subtotal,
      tip: orderData.tip,
      total,
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes,
    };

    // Clean current cart immediately
    setCartItems([]);
    setIsCartMobileOpen(false);

    try {
      // Send to server: automatically broadcasts to Barista PC/tablets!
      const created = await syncClient.createOrder(payload);
      showToast(`Comanda #${created.orderNumber} enviada a Barra en vivo ☕`);
    } catch (err) {
      console.error('Failed to create order on server:', err);
      // Offline fallback: save locally
      const offlineOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: nextOrderNum,
        customerName: orderData.customerName,
        type: orderData.type,
        tableNumber: orderData.tableNumber,
        status: 'pendiente',
        items: [...cartItems],
        subtotal,
        tip: orderData.tip,
        total,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        createdAt: Date.now(),
      };
      setOrders((prev) => [offlineOrder, ...prev]);
      setNextOrderNum((n) => n + 1);
      showToast(`Comanda #${offlineOrder.orderNumber} guardada en modo local`);
    }
  };

  // Order status update from Barista KDS (Syncs cross-device!)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: Date.now() } : o))
    );

    try {
      await syncClient.updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status on server:', err);
    }
  };

  // Menu manager actions (Syncs cross-device!)
  const handleSaveProducts = async (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    try {
      await syncClient.saveProducts(updatedProducts);
      showToast('Menú y opciones actualizados en todos los dispositivos');
    } catch (err) {
      console.error('Failed to save products:', err);
      showToast('Guardado localmente');
    }
  };

  const handleResetDefaults = async () => {
    try {
      await syncClient.resetMenu();
      showToast('Menú restablecido');
    } catch {
      showToast('Error al restablecer');
    }
  };

  const handleExportData = () => {
    const dataStr = exportBackupData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cafebarista_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Copia de respaldo exportada');
  };

  const handleImportData = async (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      await syncClient.importBackup(parsed);
      showToast('Datos importados y sincronizados');
      return true;
    } catch {
      alert('Error al leer el archivo de respaldo');
      return false;
    }
  };

  // Categories list
  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered products in POS view
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartTotal = cartItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente' || o.status === 'preparando').length;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans pb-safe-nav md:pb-10">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingOrdersCount={pendingOrdersCount}
        cartItemsCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        cartTotal={cartTotal}
        connectionStatus={connectionStatus}
        onOpenCartMobile={() => setIsCartMobileOpen(true)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenMultiDeviceModal={() => setIsMultiDeviceModalOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-stone-900 text-white text-xs font-semibold shadow-xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* VIEW 1: POS / Order Taking */}
        {activeTab === 'pos' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Products Catalog Column */}
            <div className="flex-1 w-full space-y-6">
              {/* Search & Category Filter */}
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar café por nombre o descripción..."
                    className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Category Horizontal Segmented Filter Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-200/70 dark:bg-stone-900 rounded-2xl no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setSelectedCategory(cat);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                  <Coffee className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                    No se encontraron productos
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Prueba cambiando la búsqueda o agregando nuevos productos en la pestaña de Gestión de Menú.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onCustomize={handleOpenCustomize}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop & Tablet Persistent Cart Sidebar */}
            <div className="hidden lg:block w-80 xl:w-96 shrink-0 sticky top-20">
              <OrderCartDrawer
                items={cartItems}
                isOpenMobile={false}
                onCloseMobile={() => setIsCartMobileOpen(false)}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onSubmitOrder={handleSubmitOrder}
                nextOrderNumber={nextOrderNum}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Barista Kitchen Display System (KDS) */}
        {activeTab === 'kds' && (
          <BaristaKDS
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {/* VIEW 3: Menu & Customization Options Manager */}
        {activeTab === 'menu' && (
          <MenuManager
            products={products}
            onSaveProducts={handleSaveProducts}
            onResetDefaults={handleResetDefaults}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}

        {/* VIEW 4: Sales & Metrics */}
        {activeTab === 'ventas' && (
          <SalesAnalytics
            orders={orders}
            onViewReceipt={(order) => setSelectedReceiptOrder(order)}
          />
        )}
      </main>

      {/* Mobile Cart Slide-over Sheet */}
      <OrderCartDrawer
        items={cartItems}
        isOpenMobile={isCartMobileOpen}
        onCloseMobile={() => setIsCartMobileOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
        nextOrderNumber={nextOrderNum}
      />

      {/* Coffee Customization Modal (iOS Bottom Sheet) */}
      <CustomizationModal
        product={selectedProductForModal}
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* iOS PWA Install Guide Modal */}
      <IOSInstallGuide
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      {/* Multi-Device Sync Guide & Sharing Modal */}
      <MultiDeviceModal
        isOpen={isMultiDeviceModalOpen}
        onClose={() => setIsMultiDeviceModalOpen(false)}
        connectionStatus={connectionStatus}
      />

      {/* Digital Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
}
