import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS } from './src/data/initialData.ts';
import { Product, Order, OrderStatus } from './src/types/cafe.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerStore {
  products: Product[];
  orders: Order[];
  counter: number;
}

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.products && Array.isArray(parsed.products)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading store.json, using defaults:', err);
  }

  // Initial demo seed
  const initialStore: ServerStore = {
    products: INITIAL_PRODUCTS,
    orders: [],
    counter: 100,
  };
  saveStore(initialStore);
  return initialStore;
}

function saveStore(store: ServerStore) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

let store: ServerStore = loadStore();

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // WebSocket Server attached to the same HTTP server on port 3000
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Store active SSE clients
  const sseClients = new Set<express.Response>();

  // Broadcast helper to notify all connected devices (WebSockets + SSE)
  function broadcast(event: { type: string; payload: unknown }) {
    const raw = JSON.stringify(event);

    // Broadcast to WebSockets
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(raw);
        } catch (err) {
          console.error('WS send error:', err);
        }
      }
    });

    // Broadcast to SSE clients
    sseClients.forEach((res) => {
      try {
        res.write(`data: ${raw}\n\n`);
      } catch (err) {
        sseClients.delete(res);
      }
    });
  }

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket) => {
    // Send initial snapshot on connect
    ws.send(
      JSON.stringify({
        type: 'init',
        payload: {
          products: store.products,
          orders: store.orders,
          counter: store.counter,
        },
      })
    );

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // ignore
      }
    });
  });

  // REST API Endpoints

  // 1. Get current full state
  app.get('/api/state', (req, res) => {
    res.json({
      products: store.products,
      orders: store.orders,
      counter: store.counter,
      connectedDevices: wss.clients.size,
    });
  });

  // 2. Server-Sent Events stream (backup/alternative for devices that prefer SSE)
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Send initial snapshot
    res.write(
      `data: ${JSON.stringify({
        type: 'init',
        payload: {
          products: store.products,
          orders: store.orders,
          counter: store.counter,
        },
      })}\n\n`
    );

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 3. Create new order (e.g. waiter on tablet sends order)
  app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    if (!orderData || !orderData.customerName || !Array.isArray(orderData.items)) {
      res.status(400).json({ error: 'Datos de orden incompletos' });
      return;
    }

    store.counter += 1;
    const newOrder: Order = {
      ...orderData,
      id: orderData.id || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber: store.counter,
      status: 'pendiente',
      createdAt: Date.now(),
    };

    store.orders = [newOrder, ...store.orders];
    saveStore(store);

    broadcast({
      type: 'order:created',
      payload: {
        order: newOrder,
        counter: store.counter,
      },
    });

    res.json({ success: true, order: newOrder, counter: store.counter });
  });

  // 4. Update order status (e.g. barista marks preparing, ready, completed)
  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status: OrderStatus };

    const orderIndex = store.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    const currentOrder = store.orders[orderIndex];
    const updatedOrder: Order = {
      ...currentOrder,
      status,
      updatedAt: Date.now(),
      preparedAt: status === 'preparando' ? Date.now() : currentOrder.preparedAt,
      completedAt: status === 'entregado' ? Date.now() : currentOrder.completedAt,
    };

    store.orders[orderIndex] = updatedOrder;
    saveStore(store);

    broadcast({
      type: 'order:updated',
      payload: { order: updatedOrder },
    });

    res.json({ success: true, order: updatedOrder });
  });

  // 5. Update products / menu
  app.put('/api/products', (req, res) => {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      res.status(400).json({ error: 'Array de productos inválido' });
      return;
    }

    store.products = products;
    saveStore(store);

    broadcast({
      type: 'products:updated',
      payload: { products: store.products },
    });

    res.json({ success: true, products: store.products });
  });

  // 6. Reset menu to defaults
  app.post('/api/reset-menu', (req, res) => {
    store.products = INITIAL_PRODUCTS;
    saveStore(store);

    broadcast({
      type: 'products:updated',
      payload: { products: store.products },
    });

    res.json({ success: true, products: store.products });
  });

  // 7. Full backup import
  app.post('/api/backup/import', (req, res) => {
    const { products, orders } = req.body;
    if (Array.isArray(products)) store.products = products;
    if (Array.isArray(orders)) store.orders = orders;
    saveStore(store);

    broadcast({
      type: 'state:reloaded',
      payload: {
        products: store.products,
        orders: store.orders,
        counter: store.counter,
      },
    });

    res.json({ success: true });
  });

  // Vite Integration (Dev middleware mode)
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CaféBarista Server running on http://0.0.0.0:${PORT} [Real-time multi-device sync enabled]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
