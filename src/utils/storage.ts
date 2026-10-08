import { Order, Product } from '../types/cafe';
import { INITIAL_PRODUCTS } from '../data/initialData';

const PRODUCTS_KEY = 'cafebarista_products_v1';
const ORDERS_KEY = 'cafebarista_orders_v1';
const COUNTER_KEY = 'cafebarista_counter_v1';

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch (err) {
    console.error('Error loading products from storage:', err);
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('cafebarista_products_updated'));
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading orders from storage:', err);
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('cafebarista_orders_updated'));
  } catch (err) {
    console.error('Error saving orders:', err);
  }
}

export function getNextOrderNumber(): number {
  try {
    const current = Number(localStorage.getItem(COUNTER_KEY) || '100');
    const next = current + 1;
    localStorage.setItem(COUNTER_KEY, String(next));
    return next;
  } catch {
    return Math.floor(100 + Math.random() * 899);
  }
}

export function resetToDefaultMenu(): Product[] {
  saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

export function exportBackupData(): string {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    products: getStoredProducts(),
    orders: getStoredOrders(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.products && Array.isArray(parsed.products)) {
      saveProducts(parsed.products);
    }
    if (parsed.orders && Array.isArray(parsed.orders)) {
      saveOrders(parsed.orders);
    }
    return true;
  } catch {
    return false;
  }
}
