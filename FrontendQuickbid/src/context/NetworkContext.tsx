import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { connectivityModule, NativeNetworkState } from '../mobile/nativeMobile';
import { subscribeQuickBidReachability } from '../mobile/reachability';
import { colors, fontSize, fontWeight, spacing } from '../theme';

export type ConnectionType = NativeNetworkState['type'];

type NetworkContextValue = NativeNetworkState & {
  quickBidReachable: boolean | null;
  confirmHeavyAction: () => Promise<boolean>;
};

const INITIAL_STATE: NativeNetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
};

const NetworkContext = createContext<NetworkContextValue>({
  ...INITIAL_STATE,
  quickBidReachable: null,
  confirmHeavyAction: async () => true,
});

export function NetworkProvider({ children }: PropsWithChildren) {
  const [network, setNetwork] = useState(INITIAL_STATE);
  const [quickBidReachable, setQuickBidReachable] = useState<boolean | null>(
    null,
  );
  const [reconnecting, setReconnecting] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    let active = true;
    connectivityModule
      ?.getCurrentState()
      .then(state => active && setNetwork(state))
      .catch(() => undefined);
    const subscription = DeviceEventEmitter.addListener(
      'QuickBidNetworkChanged',
      (state: NativeNetworkState) => active && setNetwork(state),
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(
    () => subscribeQuickBidReachability(setQuickBidReachable),
    [],
  );

  useEffect(() => {
    const offline = !network.isConnected || !network.isInternetReachable;
    if (offline) {
      wasOffline.current = true;
      setReconnecting(false);
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setReconnecting(true);
      const timer = setTimeout(() => setReconnecting(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [network.isConnected, network.isInternetReachable]);

  const confirmHeavyAction = useCallback(() => {
    if (network.type !== 'cellular') return Promise.resolve(true);
    return new Promise<boolean>(resolve => {
      Alert.alert(
        'Estás usando datos móviles',
        'Esta acción puede consumir datos. ¿Querés continuar?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continuar', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  }, [network.type]);

  const value = useMemo(
    () => ({ ...network, quickBidReachable, confirmHeavyAction }),
    [network, quickBidReachable, confirmHeavyAction],
  );

  const banner = bannerFor(network, quickBidReachable, reconnecting);
  return (
    <NetworkContext.Provider value={value}>
      <View style={styles.root}>
        {banner ? (
          <View style={[styles.banner, { backgroundColor: banner.color }]}>
            <Text style={styles.bannerText}>{banner.text}</Text>
          </View>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}

export function shouldWarnForHeavyAction(type: ConnectionType) {
  return type === 'cellular';
}

function bannerFor(
  network: NativeNetworkState,
  quickBidReachable: boolean | null,
  reconnecting: boolean,
) {
  if (!network.isConnected || !network.isInternetReachable)
    return { text: 'Sin conexión', color: colors.danger };
  if (reconnecting)
    return { text: 'Reconectando…', color: colors.warning };
  if (quickBidReachable === false)
    return { text: 'No se pudo contactar a QuickBid', color: colors.danger };
  if (network.type === 'cellular')
    return { text: 'Usando datos móviles', color: colors.warning };
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  banner: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  bannerText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
});
