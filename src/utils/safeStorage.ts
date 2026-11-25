const memoryFallback = new Map<string, string>();

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Bloqueio de armazenamento em iframe / modo privado
  }
  return null;
}

export function safeGetItem(key: string): string | null {
  try {
    const store = getStorage();
    if (store) {
      return store.getItem(key);
    }
  } catch {
    // fallback em memória
  }
  return memoryFallback.get(key) ?? null;
}

export function safeSetItem(key: string, value: string): void {
  memoryFallback.set(key, value);
  try {
    const store = getStorage();
    if (store) {
      store.setItem(key, value);
    }
  } catch {
    // ignora erro de armazenamento em iframe
  }
}

export function safeRemoveItem(key: string): void {
  memoryFallback.delete(key);
  try {
    const store = getStorage();
    if (store) {
      store.removeItem(key);
    }
  } catch {
    // ignora
  }
}
