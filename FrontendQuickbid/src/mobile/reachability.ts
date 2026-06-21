type Listener = (reachable: boolean) => void;

const listeners = new Set<Listener>();

export function reportQuickBidReachability(reachable: boolean) {
  listeners.forEach(listener => listener(reachable));
}

export function subscribeQuickBidReachability(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
