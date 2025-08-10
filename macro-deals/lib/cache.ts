type Entry = { expires: number; data: any };
const mem = new Map<string, Entry>();

export function getCache<T>(key: string): T | null {
  const e = mem.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) { mem.delete(key); return null; }
  return e.data as T;
}

export function setCache(key: string, data: any, ttlMs = 1000 * 60 * 60) {
  mem.set(key, { data, expires: Date.now() + ttlMs });
}
