import { NextResponse } from "next/server";
import { fetchLidl } from "../../../lib/fetchers/lidl";
import { fetchRewe } from "../../../lib/fetchers/rewe";
import { fetchAldi } from "../../../lib/fetchers/aldi";
import { fetchEdeka } from "../../../lib/fetchers/edeka";
import { fetchKaufland } from "../../../lib/fetchers/kaufland";
import { getCache, setCache } from "../../../lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip") || "10115";
  const stores = (searchParams.get("stores") || "rewe,lidl,aldi,edeka,kaufland")
    .split(",")
    .map(s => s.trim().toLowerCase());

  const cacheKey = `deals-${zip}-${stores.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ zip, stores, deals: cached, cached: true });
  }

  const fetchers: Record<string, (zip: string) => Promise<any[]>> = {
    rewe: fetchRewe,
    lidl: fetchLidl,
    aldi: fetchAldi,
    edeka: fetchEdeka,
    kaufland: fetchKaufland,
  };

  const results = await Promise.allSettled(
    stores.map(store =>
      fetchers[store] ? fetchers[store](zip) : Promise.resolve([])
    )
  );

  const deals = results.flatMap(r =>
    r.status === "fulfilled" ? r.value : []
  );

  setCache(cacheKey, deals, 1000 * 60 * 60); // 1h cache
  return NextResponse.json({ zip, stores, deals, cached: false });
}