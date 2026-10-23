import { io, Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';
import {
  NftUpdatedEventSchema,
  OrderUpdatedEventSchema,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
  type Nft,
  type NftListResponse
} from '@/contracts';
import { queryKeys } from './query-keys';

let socketInstance: Socket | null = null;
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 200;

function trackEvent(eventId: string): boolean {
  if (processedEvents.has(eventId)) {
    return true; // Already processed
  }
  processedEvents.add(eventId);
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const oldest = processedEvents.values().next().value;
    if (oldest) processedEvents.delete(oldest);
  }
  return false;
}

export function initSocket(queryClient: QueryClient): Socket {
  if (socketInstance) {
    return socketInstance;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  socketInstance = io(origin, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  socketInstance.on('connect', () => {
    // When reconnected, reconcile stale queries
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
  });

  socketInstance.on('nft.updated', (raw: unknown) => {
    const parsed = NftUpdatedEventSchema.safeParse(raw);
    if (!parsed.success) return;

    const event: NftUpdatedEvent = parsed.data;
    if (trackEvent(event.eventId)) return;

    const updatedNft = event.payload;

    // Check version against cached detail
    const cachedDetail = queryClient.getQueryData<Nft>(queryKeys.catalog.detail(updatedNft.id));
    if (cachedDetail && cachedDetail.version >= updatedNft.version) {
      return; // Discard outdated or duplicated event
    }

    // Reconcile cache
    queryClient.setQueryData(queryKeys.catalog.detail(updatedNft.id), updatedNft);

    // Reconcile every cached catalog list: patch only cards whose version is older
    queryClient.setQueriesData<NftListResponse>(
      { queryKey: [...queryKeys.catalog.all, 'list'] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === updatedNft.id && item.version < updatedNft.version
              ? { ...item, ...updatedNft }
              : item
          )
        };
      }
    );
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });

    // Announce to checkout if listening
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kurio:nft-updated', {
          detail: updatedNft
        })
      );
    }
  });

  socketInstance.on('order.updated', (raw: unknown) => {
    const parsed = OrderUpdatedEventSchema.safeParse(raw);
    if (!parsed.success) return;

    const event: OrderUpdatedEvent = parsed.data;
    if (trackEvent(event.eventId)) return;

    const updatedOrder = event.payload;
    queryClient.setQueryData(
      queryKeys.user.orders.detail(updatedOrder.userId, updatedOrder.id),
      updatedOrder
    );
    queryClient.invalidateQueries({
      queryKey: queryKeys.user.orders.all(updatedOrder.userId)
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kurio:order-updated', {
          detail: updatedOrder
        })
      );
    }
  });

  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    processedEvents.clear();
  }
}

