import { Client, IMessage, IStompSocket, StompSubscription } from '@stomp/stompjs';
import { WS_BASE_URL } from './config';
import { PujaEventoApi } from '../types/puja';

type LiveRealtimeOptions = {
  subastaId: number;
  itemId: number;
  accessToken: string;
  includePrivateQueues: boolean;
  onEvent: (event: PujaEventoApi) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (message: string) => void;
};

export function createLiveRealtimeClient(options: LiveRealtimeOptions) {
  const wsUrl = `${WS_BASE_URL}/ws`;
  const subscriptions: StompSubscription[] = [];
  let active = false;

  const destinations = [
    `/topic/subastas/${options.subastaId}/estado`,
    `/topic/subastas/${options.subastaId}/items/${options.itemId}/pujas`,
    ...(options.includePrivateQueues ? ['/user/queue/pujas', '/user/queue/notificaciones'] : []),
  ];

  const client = new Client({
    webSocketFactory: () => new WebSocket(wsUrl) as unknown as IStompSocket,
    connectHeaders: {
      Authorization: `Bearer ${options.accessToken}`,
    },
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: 3000,
    debug: () => undefined,
    onConnect: () => {
      options.onConnected?.();
      destinations.forEach(destination => {
        subscriptions.push(client.subscribe(destination, handleMessage));
      });
    },
    onDisconnect: () => {
      options.onDisconnected?.();
    },
    onStompError: frame => {
      options.onError?.(frame.body || frame.headers.message || 'Realtime no disponible');
    },
    onWebSocketError: () => {
      options.onError?.('No pudimos conectar realtime');
    },
    onWebSocketClose: () => {
      options.onDisconnected?.();
    },
  });

  function handleMessage(message: IMessage) {
    try {
      options.onEvent(JSON.parse(message.body) as PujaEventoApi);
    } catch {
      options.onError?.('Recibimos un evento realtime invalido');
    }
  }

  function unsubscribeAll() {
    while (subscriptions.length > 0) {
      subscriptions.pop()?.unsubscribe();
    }
  }

  return {
    connect() {
      if (active || client.active) return;
      active = true;
      client.activate();
    },
    disconnect() {
      active = false;
      unsubscribeAll();
      client.deactivate().catch(() => {
        options.onError?.('No pudimos cerrar realtime limpiamente');
      });
    },
  };
}
