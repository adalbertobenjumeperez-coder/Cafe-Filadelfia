import { Product, Order, OrderStatus } from '../types/cafe';
import { getStoredProducts, getStoredOrders, saveProducts as localSaveProducts, saveOrders as localSaveOrders } from './storage';

export type SyncEventCallback = (event: {
  type: 'init' | 'order:created' | 'order:updated' | 'products:updated' | 'state:reloaded';
  payload: any;
}) => void;

class SyncClient {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<SyncEventCallback> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  public isConnected: boolean = false;
  public connectionStatus: 'conectando' | 'conectado' | 'desconectado' = 'desconectado';
  private onStatusChangeListeners: Set<(status: 'conectando' | 'conectado' | 'desconectado') => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initConnection();
    }
  }

  public subscribe(cb: SyncEventCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public onStatusChange(cb: (status: 'conectando' | 'conectado' | 'desconectado') => void) {
    this.onStatusChangeListeners.add(cb);
    cb(this.connectionStatus);
    return () => {
      this.onStatusChangeListeners.delete(cb);
    };
  }

  private setStatus(status: 'conectando' | 'conectado' | 'desconectado') {
    this.connectionStatus = status;
    this.isConnected = status === 'conectado';
    this.onStatusChangeListeners.forEach((cb) => cb(status));
  }

  private notify(event: { type: any; payload: any }) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public async initConnection() {
    if (typeof window === 'undefined') return;

    this.setStatus('conectando');

    // First fetch current snapshot via REST
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        this.notify({ type: 'init', payload: data });
        // Update local cache
        if (data.products) localSaveProducts(data.products);
        if (data.orders) localSaveOrders(data.orders);
      }
    } catch {
      // Offline fallback: use local storage
      this.notify({
        type: 'init',
        payload: {
          products: getStoredProducts(),
          orders: getStoredOrders(),
          counter: 100,
        },
      });
    }

    // Try WebSocket connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('conectado');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Keepalive ping
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'pong') return;
          this.handleServerEvent(parsed);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onerror = () => {
        // Fall back to SSE if WS fails
        this.setupSSEFallback();
      };

      this.ws.onclose = () => {
        this.setStatus('desconectado');
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };
    } catch {
      this.setupSSEFallback();
    }
  }

  private setupSSEFallback() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/events');
      this.eventSource.onopen = () => {
        this.setStatus('conectado');
      };
      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.handleServerEvent(parsed);
        } catch (err) {
          console.error('Error in SSE message:', err);
        }
      };
      this.eventSource.onerror = () => {
        this.setStatus('desconectado');
      };
    } catch {
      this.setStatus('desconectado');
    }
  }

  private handleServerEvent(event: { type: string; payload: any }) {
    if (event.type === 'init' || event.type === 'state:reloaded') {
      if (event.payload.products) localSaveProducts(event.payload.products);
      if (event.payload.orders) localSaveOrders(event.payload.orders);
    } else if (event.type === 'products:updated') {
      if (event.payload.products) localSaveProducts(event.payload.products);
    }
    this.notify(event);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initConnection();
    }, 3000);
  }

  // API Methods
  public async createOrder(orderData: Partial<Order>): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      throw new Error('Error al registrar orden en el servidor');
    }

    const data = await res.json();
    return data.order;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error('Error al actualizar estado en el servidor');
    }

    const data = await res.json();
    return data.order;
  }

  public async saveProducts(products: Product[]): Promise<Product[]> {
    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });

    if (!res.ok) {
      throw new Error('Error al guardar productos en el servidor');
    }

    const data = await res.json();
    return data.products;
  }

  public async resetMenu(): Promise<void> {
    await fetch('/api/reset-menu', { method: 'POST' });
  }

  public async importBackup(data: { products: Product[]; orders: Order[] }): Promise<void> {
    await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
}

export const syncClient = new SyncClient();
