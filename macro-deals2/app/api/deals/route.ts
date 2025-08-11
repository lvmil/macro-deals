import { NextResponse } from "next/server";
import { dbGetJSON } from "../../../lib/db";
import type { Deal } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEnvelope = { zip: string; store: string; deals: Deal[]; ts: number };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip") || "10115";
  const stores = (searchParams.get("stores") || "rewe,lidl,aldi,edeka,kaufland")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  const results: Deal[] = [];
  const found: string[] = [];
  const missing: string[] = [];

  for (const s of stores) {
    const key = `deals:${s}:${zip}`;
    const env = await dbGetJSON<CacheEnvelope>(key);
    if (env && Array.isArray(env.deals) && env.deals.length) {
      results.push(...env.deals);
      found.push(s);
    } else {
      missing.push(s);
    }
  }

  // lightweight stub for any missing store so UI never hangs
  for (const s of missing) {
    if (s === "kaufland") {
      results.push(
        { id: `kaufland-stub-1-${zip}`, store: "kaufland", title: "K-Butter 250g", price: 1.79, unit: "EUR" },
        { id: `kaufland-stub-2-${zip}`, store: "kaufland", title: "Apfel 1kg",     price: 1.99, unit: "EUR" },
      );
    }
  }

  return NextResponse.json({
    zip,
    stores,
    deals: results,
    cachedStores: found,
    missingStores: missing,
  });
}
