import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Order } from './db.js';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  subscriptions: Set<string>; // order IDs or channels like 'role:owner:rest_1', 'role:admin'
}

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    ws.subscriptions = new Set<string>();

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribe') {
          // Can subscribe to `order:${orderId}` or `restaurant:${restaurantId}` or `admin`
          if (typeof message.channel === 'string') {
            ws.subscriptions.add(message.channel);
            ws.send(JSON.stringify({ type: 'subscribed', channel: message.channel }));
          }
        } else if (message.type === 'unsubscribe') {
          if (typeof message.channel === 'string') {
            ws.subscriptions.delete(message.channel);
          }
        } else if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (e) {
        // Ignore malformed client messages
      }
    });

    // Send initial connection acknowledgement
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to Zomato Real-Time Order Stream',
        timestamp: Date.now(),
      })
    );
  });

  // Heartbeat ping interval to clean dead sockets
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((client) => {
      const extWs = client as ExtendedWebSocket;
      if (!extWs.isAlive) {
        return extWs.terminate();
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

export function broadcastOrderUpdate(order: Order, eventType = 'order:status_update') {
  if (!wss) return;

  const payload = JSON.stringify({
    type: eventType,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    statusHistory: order.statusHistory,
    driverDetails: order.driverDetails,
    order,
    timestamp: Date.now(),
  });

  const orderChannel = `order:${order.id}`;
  const restaurantChannel = `restaurant:${order.restaurantId}`;
  const adminChannel = `admin`;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const extWs = client as ExtendedWebSocket;
      // Broadcast if subscribed to this order, this restaurant, or admin channel
      if (
        extWs.subscriptions &&
        (extWs.subscriptions.has(orderChannel) ||
          extWs.subscriptions.has(restaurantChannel) ||
          extWs.subscriptions.has(adminChannel) ||
          extWs.subscriptions.has('all'))
      ) {
        extWs.send(payload);
      }
    }
  });
}
