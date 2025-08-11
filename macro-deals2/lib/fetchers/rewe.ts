import { Deal } from '../types';
import { parse } from 'node-html-parser';
import { fetchHtml } from '../http';

function toNum(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function scrape(url: string): Promise<Deal[]> {
  const html = await fetchHtml(url);
  if (!html) return [];
  const root = parse(html);
  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  const deals: Deal[] = [];

  for (const s of scripts) {
    const raw = s.text?.trim();
    if (!raw) continue;
    let data: any;
    try { data = JSON.parse(raw); } catch { continue; }
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
          const img =
            typeof node?.image === 'string' ? node.image :
            Array.isArray(node?.image) ? node.image[0] : undefined;
          const validTo: string | undefined =
            offer?.priceValidUntil || node?.validThrough || node?.validTo || undefined;
          deals.push({
            id: `rewe-${name.slice(0,24)}-${deals.length}`,
            store: 'rewe',
            title: name,
            price: priceNum,
            unit: currency,
            image: img,
            validTo,
          });
        }
      }
    }
  }
  return deals;
}

export async function fetchRewe(zip: string): Promise<Deal[]> {
  const urls = [
    `https://www.rewe.de/angebote/?search=${encodeURIComponent(zip)}`,
    `https://www.rewe.de/angebote/`,
  ];
  for (const url of urls) {
    try {
      const out = await scrape(url);
      if (out.length) return out;
    } catch {}
  }
  return [
    { id: `rewe-stub-1-${zip}`, store: 'rewe', title: 'Milk 1L',    price: 1.09, unit: 'EUR' },
    { id: `rewe-stub-2-${zip}`, store: 'rewe', title: 'Bananas 1kg', price: 1.19, unit: 'EUR' },
  ];
}