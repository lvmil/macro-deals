import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/cache";
import { fetchRewe } from "@/lib/fetchers/rewe";
import { fetchLidl } from "@/lib/fetchers/lidl";
import { fetchAldi } from "@/lib/fetchers/aldi";
import { fetchEdeka } from "@/lib/fetchers/edeka";
import { fetchKaufland } from "@/lib/fetchers/kaufland";
import { Deal } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");
  const storesParam = searchParams.get("stores");
  const noCache = searchParams.get("nocache") === "true";

  if (!zip || !storesParam) {
    return NextResponse.json({ error: "Missing zip or stores" }, { status: 400 });
  }

  const stores = storesParam.split(",").map(s => s.trim().toLowerCase());
  const cacheKey = `deals:${zip}:${stores.sort().join(",")}`;

  if (!noCache) {
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json({ zip, stores, deals: cached, cached: true });
  }

  const fetcherMap: Record<string, (zip: string) => Promise<Deal[]>> = {
    rewe: fetchRewe,
    lidl: fetchLidl,
    aldi: fetchAldi,
    edeka: fetchEdeka,
    kaufland: fetchKaufland,
  };

  const results = await Promise.allSettled(
    stores.map(s => (fetcherMap[s] ? fetcherMap[s](zip) : Promise.resolve([])))
  );

  const deals = results.flatMap(r => (r.status === "fulfilled" ? r.value : []));
  setCache(cacheKey, deals, 1000 * 60 * 60);

  return NextResponse.json({ zip, stores, deals, cached: false });
}
