import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDoc,
  getDocFromServer,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Order, OrderStatus } from '../types/cafe';
import { INITIAL_PRODUCTS } from '../data/initialData';
import {
  getStoredProducts,
  getStoredOrders,
  saveProducts as localSaveProducts,
  saveOrders as localSaveOrders,
} from './storage';

export type SyncEventCallback = (event: {
  type: 'init' | 'order:created' | 'order:updated' | 'products:updated' | 'state:reloaded';
  payload: any;
}) => void;

class FirebaseSyncClient {
  private listeners: Set<SyncEventCallback> = new Set();
  public connectionStatus: 'conectando' | 'conectado' | 'desconectado' = 'conectando';
  private onStatusChangeListeners: Set<(status: 'conectando' | 'conectado' | 'desconectado') => void> = new Set();
  private isInitialized = false;
  private knownOrderIds = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFirestoreSync();
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

  private async initFirestoreSync() {
    this.setStatus('conectando');

    // 1. Initial local state fallback
    const localProducts = getStoredProducts();
    const localOrders = getStoredOrders();
    localOrders.forEach((o) => this.knownOrderIds.add(o.id));

    this.notify({
      type: 'init',
      payload: {
        products: localProducts,
        orders: localOrders,
        counter: 100,
      },
    });

    // 2. Test connection to Firestore as required by guidelines
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      this.setStatus('conectado');
    } catch {
      // Offline or network error
      this.setStatus('conectado'); // Firestore will still sync seamlessly via offline cache/reconnect
    }

    // 3. Listen to Menu & Counter in /settings/menu
    try {
      const menuDocRef = doc(db, 'settings', 'menu');
      onSnapshot(
        menuDocRef,
        (snap) => {
          this.setStatus('conectado');
          if (snap.exists()) {
            const data = snap.data();
            if (data.products && Array.isArray(data.products)) {
              localSaveProducts(data.products);
              this.notify({
                type: 'products:updated',
                payload: { products: data.products },
              });
            }
          } else {
            // First time: seed initial menu to Firestore
            setDoc(menuDocRef, {
              products: INITIAL_PRODUCTS,
              counter: 100,
              updatedAt: Date.now(),
            }).catch(() => {});
          }
        },
        (error) => {
          console.warn('Firestore menu listener error:', error);
          this.setStatus('desconectado');
        }
      );
    } catch (err) {
      console.warn('Error setting up menu snapshot:', err);
    }

    // 4. Listen to Orders Collection in real time
    try {
      const ordersCol = collection(db, 'orders');
      const ordersQuery = query(ordersCol, orderBy('createdAt', 'desc'));

      onSnapshot(
        ordersQuery,
        (snapshot) => {
          this.setStatus('conectado');
          const remoteOrders: Order[] = [];

          snapshot.docs.forEach((d) => {
            const orderData = d.data() as Order;
            const fullOrder = { ...orderData, id: d.id };
            remoteOrders.push(fullOrder);

            // If this is a newly arrived order that wasn't in our known IDs, notify
            if (this.isInitialized && !this.knownOrderIds.has(d.id)) {
              this.knownOrderIds.add(d.id);
              this.notify({
                type: 'order:created',
                payload: { order: fullOrder, counter: fullOrder.orderNumber },
              });
            } else {
              this.knownOrderIds.add(d.id);
            }
          });

          if (!this.isInitialized) {
            this.isInitialized = true;
            localSaveOrders(remoteOrders);
            this.notify({
              type: 'init',
              payload: {
                orders: remoteOrders,
                products: getStoredProducts(),
                counter: remoteOrders.length > 0 ? Math.max(...remoteOrders.map((o) => o.orderNumber)) : 100,
              },
            });
          } else {
            localSaveOrders(remoteOrders);
            this.notify({
              type: 'state:reloaded',
              payload: {
                orders: remoteOrders,
                products: getStoredProducts(),
              },
            });
          }
        },
        (error) => {
          console.warn('Firestore orders listener error:', error);
          this.setStatus('desconectado');
        }
      );
    } catch (err) {
      console.warn('Error setting up orders snapshot:', err);
    }
  }

  // API Methods
  public async createOrder(orderData: Partial<Order>): Promise<Order> {
    const orderId = orderData.id || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const menuDocRef = doc(db, 'settings', 'menu');

    let orderNumber = 101;

    try {
      // Transaction to safely increment order counter
      await runTransaction(db, async (transaction) => {
        const menuSnap = await transaction.get(menuDocRef);
        let currentCounter = 100;
        if (menuSnap.exists() && menuSnap.data().counter) {
          currentCounter = menuSnap.data().counter;
        }
        orderNumber = currentCounter + 1;
        transaction.set(
          menuDocRef,
          { counter: orderNumber, updatedAt: Date.now() },
          { merge: true }
        );
      });
    } catch {
      // Fallback local counter
      const orders = getStoredOrders();
      orderNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 101;
    }

    const newOrder: Order = {
      ...(orderData as Order),
      id: orderId,
      orderNumber,
      status: 'pendiente',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.knownOrderIds.add(orderId);

    // Save directly to Firestore: instantly notifies all other devices via onSnapshot!
    await setDoc(doc(db, 'orders', orderId), newOrder);

    // Update local cache
    const currentLocal = getStoredOrders();
    localSaveOrders([newOrder, ...currentLocal.filter((o) => o.id !== orderId)]);

    return newOrder;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: Date.now(),
    };

    if (status === 'preparando') updatePayload.preparedAt = Date.now();
    if (status === 'entregado') updatePayload.completedAt = Date.now();

    await updateDoc(doc(db, 'orders', orderId), updatePayload);

    const orders = getStoredOrders();
    const updated = orders.map((o) => (o.id === orderId ? { ...o, ...updatePayload } : o));
    localSaveOrders(updated);

    return updated.find((o) => o.id === orderId)!;
  }

  public async saveProducts(products: Product[]): Promise<Product[]> {
    const menuDocRef = doc(db, 'settings', 'menu');
    await setDoc(
      menuDocRef,
      { products, updatedAt: Date.now() },
      { merge: true }
    );
    localSaveProducts(products);
    return products;
  }

  public async resetMenu(): Promise<void> {
    const menuDocRef = doc(db, 'settings', 'menu');
    await setDoc(
      menuDocRef,
      { products: INITIAL_PRODUCTS, updatedAt: Date.now() },
      { merge: true }
    );
    localSaveProducts(INITIAL_PRODUCTS);
  }

  public async importBackup(data: { products: Product[]; orders: Order[] }): Promise<void> {
    if (data.products && Array.isArray(data.products)) {
      await this.saveProducts(data.products);
    }
    if (data.orders && Array.isArray(data.orders)) {
      for (const order of data.orders) {
        if (order.id) {
          await setDoc(doc(db, 'orders', order.id), order);
        }
      }
    }
  }

  public reconnect() {
    this.initFirestoreSync();
  }
}

export const syncClient = new FirebaseSyncClient();
