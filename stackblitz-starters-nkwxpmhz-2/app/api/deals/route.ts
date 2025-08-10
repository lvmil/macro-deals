import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/cache";
import { fetchRewe } from "@/lib/fetchers/rewe";
import { fetchLidl } from "@/lib/fetchers/lidl";
import { fetchAldi } from "@/lib/fetchers/aldi";
import { fetchEdeka } from "@/lib/fetchers/edeka";
import { fetchKaufland } from "@/lib/fetchers/kaufland";
import { Deal } from "@/lib/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { return Response.json({ ok:true }); }
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip") || "10115";
  const stores = (searchParams.get("stores") || "rewe,lidl,aldi,edeka,kaufland")
    .split(",")
    .map(s => s.trim().toLowerCase());

  const cacheKey = `deals:${zip}:${stores.sort().join(",")}`;
  const cached = getCache<Deal[]>(cacheKey);
  if (cached) return NextResponse.json({ zip, stores, deals: cached, cached: true });

  const tasks: Promise<Deal[]>[] = [];
  if (stores.includes("rewe")) tasks.push(fetchRewe(zip));
  if (stores.includes("lidl")) tasks.push(fetchLidl(zip));
  if (stores.includes("aldi")) tasks.push(fetchAldi(zip));
  if (stores.includes("edeka")) tasks.push(fetchEdeka(zip));
  if (stores.includes("kaufland")) tasks.push(fetchKaufland(zip));

  const results = await Promise.allSettled(tasks);
  const deals = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  setCache(cacheKey, deals, 1000 * 60 * 60);
  return NextResponse.json({ zip, stores, deals, cached: false });
}