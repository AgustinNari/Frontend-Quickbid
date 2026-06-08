import {
  Client,
  IMessage,
  IStompSocket,
  StompSubscription,
} from '@stomp/stompjs';
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
  let connectionTimer: ReturnType<typeof setTimeout> | null = null;

  const destinations = [
    `/topic/subastas/${options.subastaId}/estado`,
    `/topic/subastas/${options.subastaId}/items/${options.itemId}/pujas`,
    ...(options.includePrivateQueues
      ? ['/user/queue/pujas', '/user/queue/notificaciones']
      : []),
  ];

  const client = new Client({
    webSocketFactory: () => new WebSocket(wsUrl) as unknown as IStompSocket,
    connectHeaders: {
      Authorization: `Bearer ${options.accessToken}`,
    },
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    forceBinaryWSFrames: true,
    reconnectDelay: 3000,
    debug: message => logRealtime(message),
    onConnect: () => {
      clearConnectionTimer();
      logRealtime(`connected ${wsUrl}`);
      options.onConnected?.();
      destinations.forEach(destination => {
        subscriptions.push(client.subscribe(destination, handleMessage));
      });
    },
    onDisconnect: () => {
      options.onDisconnected?.();
    },
    onStompError: frame => {
      logRealtime(`broker error: ${frame.headers.message ?? frame.body}`);
      options.onError?.(
        frame.body || frame.headers.message || 'Realtime no disponible',
      );
    },
    onWebSocketError: event => {
      logRealtime(`websocket error: ${String(event)}`);
      options.onError?.('No pudimos conectar realtime');
    },
    onWebSocketClose: event => {
      logRealtime(`websocket closed: ${event.code} ${event.reason}`);
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

  function clearConnectionTimer() {
    if (connectionTimer) {
      clearTimeout(connectionTimer);
      connectionTimer = null;
    }
  }

  return {
    connect() {
      if (active || client.active) return;
      active = true;
      client.activate();
      connectionTimer = setTimeout(() => {
        connectionTimer = null;
        if (!client.connected) {
          logRealtime(`connection timeout ${wsUrl}`);
          options.onError?.('No pudimos conectar realtime');
        }
      }, 15000);
    },
    disconnect() {
      active = false;
      clearConnectionTimer();
      unsubscribeAll();
      client.deactivate().catch(() => {
        options.onError?.('No pudimos cerrar realtime limpiamente');
      });
    },
  };
}

function logRealtime(message: string) {
  if (__DEV__) {
    console.info(
      `[realtime] ${message.replace(
        /Authorization:Bearer [^\n]+/,
        'Authorization:Bearer [redacted]',
      )}`,
    );
  }
}
