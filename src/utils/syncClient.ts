import { Product, Order, OrderStatus } from '../types/cafe';
import { getStoredProducts, getStoredOrders, saveProducts as localSaveProducts, saveOrders as localSaveOrders } from './storage';

export type SyncEventCallback = (event: {
  type: 'init' | 'order:created' | 'order:updated' | 'products:updated' | 'state:reloaded';
  payload: any;
}) => void;

// Default Cloud Run backend URL where server.ts runs
export const DEFAULT_CLOUD_SERVER_URL = 'https://ais-dev-wbmxpspt7xllkujwtmst3z-716059199071.us-west2.run.app';
const SERVER_URL_KEY = 'cafebarista_server_url';

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

  public getServerBaseUrl(): string {
    if (typeof window === 'undefined') return '';

    // Check user customized server URL
    const saved = localStorage.getItem(SERVER_URL_KEY);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // If running on GitHub Pages (or external static host without backend), default to Cloud Run server
    if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
      return DEFAULT_CLOUD_SERVER_URL;
    }

    // When running on localhost or Cloud Run directly, use same-origin relative URLs
    return '';
  }

  public setServerBaseUrl(url: string) {
    if (typeof window === 'undefined') return;
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem(SERVER_URL_KEY, clean);
    } else {
      localStorage.removeItem(SERVER_URL_KEY);
    }
    this.reconnect();
  }

  public reconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    this.initConnection();
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
    if (typeof window !== 'undefined') {
      this.setStatus('conectando');
      const baseUrl = this.getServerBaseUrl();

      // 1. Snapshot fetch via REST
      try {
        const res = await fetch(`${baseUrl}/api/state`, {
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          this.notify({ type: 'init', payload: data });
          if (data.products) localSaveProducts(data.products);
          if (data.orders) localSaveOrders(data.orders);
          this.setStatus('conectado');
        } else {
          throw new Error(`Server returned status ${res.status}`);
        }
      } catch (err) {
        console.warn('Initial fetch from backend failed, using local offline cache:', err);
        this.notify({
          type: 'init',
          payload: {
            products: getStoredProducts(),
            orders: getStoredOrders(),
            counter: 100,
          },
        });
      }

      // 2. Open real-time WebSocket connection
      try {
        let wsUrl: string;
        if (baseUrl) {
          const parsed = new URL(baseUrl);
          const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${wsProtocol}//${parsed.host}/ws`;
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${protocol}//${window.location.host}/ws`;
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.setStatus('conectado');
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }

          if (this.pingInterval) clearInterval(this.pingInterval);
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
          this.setupSSEFallback(baseUrl);
        };

        this.ws.onclose = () => {
          if (this.pingInterval) clearInterval(this.pingInterval);
          this.setupSSEFallback(baseUrl);
        };
      } catch {
        this.setupSSEFallback(baseUrl);
      }
    }
  }

  private setupSSEFallback(baseUrl: string) {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource(`${baseUrl}/api/events`);
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
        this.scheduleReconnect();
      };
    } catch {
      this.setStatus('desconectado');
      this.scheduleReconnect();
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
    }, 4000);
  }

  // API Methods
  public async createOrder(orderData: Partial<Order>): Promise<Order> {
    const baseUrl = this.getServerBaseUrl();
    const res = await fetch(`${baseUrl}/api/orders`, {
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
    const baseUrl = this.getServerBaseUrl();
    const res = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(orderId)}/status`, {
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
    const baseUrl = this.getServerBaseUrl();
    const res = await fetch(`${baseUrl}/api/products`, {
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
    const baseUrl = this.getServerBaseUrl();
    await fetch(`${baseUrl}/api/reset-menu`, { method: 'POST' });
  }

  public async importBackup(data: { products: Product[]; orders: Order[] }): Promise<void> {
    const baseUrl = this.getServerBaseUrl();
    await fetch(`${baseUrl}/api/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async testServerConnection(url: string): Promise<boolean> {
    try {
      const clean = url.trim().replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/state`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const syncClient = new SyncClient();
