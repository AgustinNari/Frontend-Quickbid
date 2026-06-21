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

const MAX_RECONNECT_ATTEMPTS = 5;

export function createLiveRealtimeClient(options: LiveRealtimeOptions) {
  const wsUrl = `${WS_BASE_URL}/ws`;
  const subscriptions: StompSubscription[] = [];
  let active = false;
  let reconnectAttempts = 0;
  let stabilityTimer: ReturnType<typeof setTimeout> | null = null;

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
    connectionTimeout: 15000,
    reconnectDelay: 3000,
    debug: message => logRealtime(message),
    onConnect: () => {
      clearStabilityTimer();
      stabilityTimer = setTimeout(() => {
        reconnectAttempts = 0;
        stabilityTimer = null;
      }, 30000);
      subscriptions.length = 0;
      logRealtime(`connected ${wsUrl}`);
      if (!active) return;
      options.onConnected?.();
      destinations.forEach(destination => {
        subscriptions.push(client.subscribe(destination, handleMessage));
      });
    },
    onDisconnect: () => {
      if (active) options.onDisconnected?.();
    },
    onStompError: frame => {
      logRealtime(`broker error: ${frame.headers.message ?? frame.body}`);
      options.onError?.('No pudimos mantener la actualizacion en vivo.');
    },
    onWebSocketError: event => {
      logRealtime(`websocket error: ${String(event)}`);
      if (active)
        options.onError?.('No pudimos conectar la actualizacion en vivo.');
    },
    onWebSocketClose: event => {
      logRealtime(`websocket closed: ${event.code} ${event.reason}`);
      clearStabilityTimer();
      if (!active) return;
      reconnectAttempts += 1;
      options.onDisconnected?.();
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        active = false;
        options.onError?.(
          'La actualizacion en vivo sigue sin responder. Reintenta desde la sala.',
        );
        client.deactivate({ force: true }).catch(() => {
          logRealtime('realtime shutdown after retry limit failed');
        });
      }
    },
  });

  function handleMessage(message: IMessage) {
    if (!active) return;
    try {
      options.onEvent(JSON.parse(message.body) as PujaEventoApi);
    } catch {
      options.onError?.('Recibimos una actualizacion invalida.');
    }
  }

  function unsubscribeAll() {
    while (subscriptions.length > 0) {
      subscriptions.pop()?.unsubscribe();
    }
  }

  function clearStabilityTimer() {
    if (stabilityTimer) {
      clearTimeout(stabilityTimer);
      stabilityTimer = null;
    }
  }

  return {
    connect() {
      if (active || client.active) return;
      active = true;
      reconnectAttempts = 0;
      client.activate();
    },
    disconnect() {
      active = false;
      clearStabilityTimer();
      if (client.connected) unsubscribeAll();
      else subscriptions.length = 0;
      client.deactivate().catch(() => {
        logRealtime('realtime shutdown failed');
      });
    },
  };
}

function logRealtime(message: string) {
  if (__DEV__) {
    console.info(
      `[realtime] ${message.replace(
        /Authorization:\s*Bearer\s+[^\n]+/gi,
        'Authorization:Bearer [redacted]',
      )}`,
    );
  }
}
