import { NextResponse } from "next/server";
import { getCache, setCache } from "../../../lib/cache";
import type { Deal } from "../../../lib/types";
import { fetchRewe } from "../../../lib/fetchers/rewe";
import { fetchLidl } from "../../../lib/fetchers/lidl";
import { fetchAldi } from "../../../lib/fetchers/aldi";
import { fetchEdeka } from "../../../lib/fetchers/edeka";
import { fetchKaufland } from "../../../lib/fetchers/kaufland";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const zip = searchParams.get("zip") || "10115";
  const stores = (searchParams.get("stores") || "rewe,lidl,aldi,edeka,kaufland")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const noCache = ["1", "true"].includes(
    (searchParams.get("nocache") || "").toLowerCase()
  );

  const cacheKey = `deals:${zip}:${stores.sort().join(",")}`;
  if (!noCache) {
    const cached = getCache<Deal[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ zip, stores, deals: cached, cached: true });
    }
  }

  const fetchers: Record<string, (z: string) => Promise<Deal[]>> = {
    rewe: fetchRewe,
    lidl: fetchLidl,
    aldi: fetchAldi,
    edeka: fetchEdeka,
    kaufland: fetchKaufland,
  };

  const tasks = stores.map(async (s) => {
    const fn = fetchers[s];
    if (!fn) return [] as Deal[];
    try {
      return await fn(zip);
    } catch (err) {
      console.error(`[deals] ${s} error`, err);
      return [] as Deal[];
    }
  });

  const settled = await Promise.allSettled(tasks);
  const deals = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (!noCache) setCache(cacheKey, deals, 1000 * 60 * 2); // 2 min cache while testing
  return NextResponse.json({ zip, stores, deals, cached: false });
}
