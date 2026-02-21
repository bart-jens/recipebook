type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(event: string, listener: Listener): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(listener);
  return () => {
    listeners.get(event)?.delete(listener);
  };
}

export function emit(event: string) {
  listeners.get(event)?.forEach((fn) => fn());
}
