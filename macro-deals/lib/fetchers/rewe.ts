import { Deal } from '../types';
import * as cheerio from 'cheerio';

function toNum(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function tryApi(zip: string): Promise<Deal[]> {
  try {
    const searchUrl = `https://shop.rewe.de/api/market-search?searchTerm=${encodeURIComponent(zip)}&marketChain=REWE`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (MacroDealsBot/1.0)' },
      cache: 'no-store',
    });
    if (!searchRes.ok) throw new Error('search failed');
    const sj: any = await searchRes.json();
    const marketId: string | undefined = sj?.markets?.[0]?.wwIdent;
    if (!marketId) throw new Error('no marketId');

    const promoUrl = `https://shop.rewe.de/api/promotions?marketCode=${encodeURIComponent(marketId)}`;
    const promoRes = await fetch(promoUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (MacroDealsBot/1.0)' },
      cache: 'no-store',
    });
    if (!promoRes.ok) throw new Error('promos failed');
    const pj: any = await promoRes.json();
    const promos: any[] = pj?.promotions ?? pj?.items ?? pj?.data ?? [];

    const out: Deal[] = [];
    promos.forEach((p: any, i: number) => {
      const title = p?.title || p?.name || p?.productName || p?.product?.name;
      const price = toNum(p?.price?.value ?? p?.price ?? p?.currentPrice ?? p?.offerPrice);
      const unit = p?.price?.unit || p?.unit || p?.priceUnit || 'EUR';
      const image = p?.image || p?.imageUrl || p?.assets?.[0]?.url;
      const validTo = p?.endDate || p?.validTo || p?.validUntil;
      if (!title || price == null) return;
      out.push({
        id: `rewe-${marketId}-${i}`,
        store: 'rewe',
        title,
        price,
        unit: typeof unit === 'string' && unit.includes('€') ? 'EUR' : unit,
        image,
        validTo,
      });
    });
    return out;
  } catch {
    return [];
  }
}

async function tryHtml(zip: string): Promise<Deal[]> {
  try {
    const url = `https://www.rewe.de/angebote/?search=${encodeURIComponent(zip)}`;
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (MacroDealsBot/1.0)',
        'accept': 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
    const html = await res.text();
    const $ = cheerio.load(html);
    const deals: Deal[] = [];
    $('script[type="application/ld+json"]').each((i, el) => {
      const raw = $(el).contents().text();
      if (!raw) return;
      let data: any;
      try { data = JSON.parse(raw); } catch { return; }
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const graph = item?.['@graph'];
        const nodes = Array.isArray(graph) ? graph : [item];
        for (const node of nodes) {
          const type = node?.['@type'];
          const isProduct = (typeof type === 'string' && type.toLowerCase().includes('product')) ||
            (Array.isArray(type) && type.some((t: string) => t.toLowerCase().includes('product')));
          if (!isProduct) continue;
          const name: string = node?.name || node?.title || '';
          const offers = node?.offers;
          if (!name || !offers) continue;
          const list = Array.isArray(offers) ? offers : [offers];
          for (const offer of list) {
            const priceNum = toNum(offer?.price);
            if (priceNum == null) continue;
            const currency: string = offer?.priceCurrency || 'EUR';
            const image =
              typeof node?.image === 'string' ? node.image :
              Array.isArray(node?.image) ? node.image[0] : undefined;
            const validTo: string | undefined =
              offer?.priceValidUntil || node?.validThrough || node?.validTo || undefined;
            deals.push({
              id: `rewe-html-${i}-${name.slice(0,24)}`,
              store: 'rewe',
              title: name,
              price: priceNum,
              unit: currency,
              image,
              validTo,
            });
          }
        }
      }
    });
    return deals;
  } catch {
    return [];
  }
}

export async function fetchRewe(zip: string): Promise<Deal[]> {
  const api = await tryApi(zip);
  if (api.length > 0) return api;
  const html = await tryHtml(zip);
  if (html.length > 0) return html;
  return [
    { id: `rewe-stub-1-${zip}`, store: 'rewe', title: 'Milk 1L',    price: 1.09, unit: 'EUR' },
    { id: `rewe-stub-2-${zip}`, store: 'rewe', title: 'Bananas 1kg', price: 1.19, unit: 'EUR' },
  ];
}
