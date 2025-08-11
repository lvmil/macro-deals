// lib/db.ts — tiny Upstash REST client
const URL_ = process.env.UPSTASH_REDIS_REST_URL!;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

if (!URL_ || !TOKEN) {
  console.warn("[db] Upstash env vars missing; read/write will no-op.");
}

async function upstash(cmd: any[]) {
  if (!URL_ || !TOKEN) return null;
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([cmd]),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = await res.json();
  return data?.[0]?.result ?? null;
}

export async function dbSetJSON(key: string, value: any, ttlSec?: number) {
  const payload = JSON.stringify(value);
  await upstash(["SET", key, payload]);
  if (ttlSec && ttlSec > 0) await upstash(["EXPIRE", key, String(ttlSec)]);
}

export async function dbGetJSON<T>(key: string): Promise<T | null> {
  const raw = (await upstash(["GET", key])) as string | null;
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
