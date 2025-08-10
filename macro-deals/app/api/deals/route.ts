import { NextResponse } from 'next/server';
import { getCache, setCache } from '../../../lib/cache';
import { fetchRewe } from '../../../lib/fetchers/rewe';
import { fetchLidl } from '../../../lib/fetchers/lidl';
import { fetchAldi } from '../../../lib/fetchers/aldi';
import { fetchEdeka } from '../../../lib/fetchers/edeka';
import { fetchKaufland } from '../../../lib/fetchers/kaufland';
import type { Deal } from '../../../lib/types';
import { NextResponse } from "next/server";
import { fetchHtml } from "../../../lib/http";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get('zip') || '10115';
  const stores = (searchParams.get('stores') || 'rewe,lidl,aldi,edeka,kaufland')
    .split(',')
    .map(s => s.trim().toLowerCase());
  const noCache = searchParams.get('nocache') === '1' || searchParams.get('nocache') === 'true';
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing ?url=" }, { status: 400 });

  const cacheKey = `deals:${zip}:${stores.sort().join(',')}`;
  if (!noCache) {
    const cached = getCache<Deal[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ zip, stores, deals: cached, cached: true });
    }
  }

  const fetchers: Record<string, (zip: string) => Promise<Deal[]>> = {
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
      const res = await fn(zip);
      return res;
    } catch (e) {
      console.error(`[deals] ${s} error:`, e);
      return [] as Deal[];
    }
  const html = await fetchHtml(url);
  const snippet = html ? html.slice(0, 1200) : "";
  return NextResponse.json({
    usedProxy: process.env.USE_PROXY === "1",
    target: url,
    length: html.length,
    snippet
  });

  const results = await Promise.allSettled(tasks);
  const deals = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));

  if (!noCache) setCache(cacheKey, deals, 1000 * 60 * 30);
  return NextResponse.json({ zip, stores, deals, cached: false });
}
