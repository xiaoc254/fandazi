// 安全 storage 封装：localStorage 不可用（隐私模式 / 沙箱预览）时退回内存态。
// 所有写入都包了 try/catch，绝不让 storage 异常打挂 UI。

const memory = new Map<string, string>();
let warned = false;

function canUse(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const k = "__chishenme_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

let available = canUse();

export function isStoragePersistent(): boolean {
  return available;
}

export function safeGet(key: string): string | null {
  try {
    if (available && typeof window !== "undefined") {
      return window.localStorage.getItem(key);
    }
  } catch {
    available = false;
  }
  return memory.has(key) ? memory.get(key)! : null;
}

export function safeSet(key: string, value: string): void {
  try {
    if (available && typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    available = false;
    if (!warned) {
      // eslint-disable-next-line no-console
      console.warn("[chishenme] localStorage 不可用，已退回内存态，刷新后会丢失。");
      warned = true;
    }
  }
  memory.set(key, value);
}

export function safeRemove(key: string): void {
  try {
    if (available && typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  } catch {
    available = false;
  }
  memory.delete(key);
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    safeSet(key, JSON.stringify(value));
  } catch {
    // 序列化失败时静默忽略
  }
}
