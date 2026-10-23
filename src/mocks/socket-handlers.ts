import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import type { Nft, Order, NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts';

export type SocketIoClient = ReturnType<typeof toSocketIo>['client'];

const connectedClients = new Set<SocketIoClient>();

// Intercepts any WebSocket connection matching socket.io path
export const socketLink = ws.link(/socket\.io/);

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection);
    const client = io.client;
    connectedClients.add(client);

    // Initial handshake ping/pong support
    client.on('ping', () => {
      client.emit('pong');
    });

    // Cleanup on disconnect
    connection.client.addEventListener('close', () => {
      connectedClients.delete(client);
    });
  })
];

export function emitNftUpdated(nft: Nft): NftUpdatedEvent {
  const envelope: NftUpdatedEvent = {
    eventId: `evt_nft_${nft.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    version: nft.version,
    timestamp: new Date().toISOString(),
    payload: nft
  };

  for (const client of connectedClients) {
    try {
      client.emit('nft.updated', envelope);
    } catch {
      connectedClients.delete(client);
    }
  }

  return envelope;
}

export function emitOrderUpdated(order: Order): OrderUpdatedEvent {
  const envelope: OrderUpdatedEvent = {
    eventId: `evt_ord_${order.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    version: order.version,
    timestamp: new Date().toISOString(),
    payload: order
  };

  for (const client of connectedClients) {
    try {
      client.emit('order.updated', envelope);
    } catch {
      connectedClients.delete(client);
    }
  }

  return envelope;
}
