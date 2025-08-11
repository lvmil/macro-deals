import { Deal } from "../types";
import { parse } from "node-html-parser";
import { fetchHtml } from "../http";

function toNum(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", ".").replace(/[^\d.]/g, ""));
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
      const graph = item?.["@graph"];
      const nodes = Array.isArray(graph) ? graph : [item];
      for (const node of nodes) {
        const type = node?.["@type"];
        const isProduct =
          (typeof type === "string" && type.toLowerCase().includes("product")) ||
          (Array.isArray(type) && type.some((t: string) => t.toLowerCase().includes("product")));
        if (!isProduct) continue;

        const name: string = node?.name || node?.title || "";
        const offers = node?.offers;
        if (!name || !offers) continue;
        const list = Array.isArray(offers) ? offers : [offers];

        for (const offer of list) {
          const priceNum = toNum(offer?.price);
          if (priceNum == null) continue;
          deals.push({
            id: `kaufland-${name.slice(0,24)}-${deals.length}`,
            store: "kaufland",
            title: name,
            price: priceNum,
            unit: offer?.priceCurrency || "EUR",
            image: typeof (node as any)?.image === "string" ? (node as any).image
                 : Array.isArray((node as any)?.image) ? (node as any).image[0] : undefined,
            validTo: offer?.priceValidUntil || (node as any)?.validThrough || (node as any)?.validTo
          });
        }
      }
    }
  }
  // dedupe & sort
  const seen = new Set<string>();
  const uniq = deals.filter(d => {
    const k = `${d.title}|${d.price}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  uniq.sort((a,b)=>(a.price??1e9)-(b.price??1e9));
  return uniq;
}

export async function fetchKaufland(zip: string): Promise<Deal[]> {
  // DO NOT use ?search=ZIP via proxy (404/500)
  const candidates = [
    "https://www.kaufland.de/angebote/aktuell.html",
    "https://www.kaufland.de/angebote/prospekt.html",
    "https://www.kaufland.de/angebote/"
  ];

  for (const url of candidates) {
    try {
      let out = await scrape(url);
      if (!out.length) {
        await new Promise(r => setTimeout(r, 700));
        out = await scrape(url);
      }
      if (out.length) return out;
    } catch (e) {
      console.error("[kaufland] scrape error", url, e);
    }
  }

  return [
    { id: `kaufland-stub-1-${zip}`, store: "kaufland", title: "K-Butter 250g", price: 1.79, unit: "EUR" },
    { id: `kaufland-stub-2-${zip}`, store: "kaufland", title: "Apfel 1kg",     price: 1.99, unit: "EUR" }
  ];
}
