import { NextResponse } from "next/server";
import { dbSetJSON } from "../../../../lib/db";
import { Deal } from "../../../../lib/types";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function crawlKauflandWithPlaywright(url: string): Promise<{ deals: Deal[], htmlLen: number }> {
  const browser = await chromium.launch({ args: ["--no-sandbox","--disable-setuid-sandbox"], headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      locale: "de-DE"
    });
    const page = await ctx.newPage();
    await page.goto("https://www.kaufland.de/", { waitUntil: "domcontentloaded", timeout: 60000 });
    try { await page.getByRole("button", { name: /akzeptieren|zustimmen|alle akzeptieren/i }).click({ timeout: 3000 }); } catch {}
    await page.goto(url, { waitUntil: "networkidle", timeout: 65000 });

    // 1) Try ld+json in-page (reliable across layouts)
    const { htmlLen, items } = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const products: any[] = [];
      for (const s of scripts) {
        try {
          const data = JSON.parse(s.textContent || "null");
          const arr = Array.isArray(data) ? data : [data];
          for (const item of arr) {
            const graph = item && item["@graph"];
            const nodes = Array.isArray(graph) ? graph : [item];
            for (const node of nodes) {
              const t = node && node["@type"];
              const isProd = (typeof t === "string" && t.toLowerCase().includes("product")) ||
                             (Array.isArray(t) && t.some((x: string) => x.toLowerCase().includes("product")));
              if (!isProd) continue;
              const name = (node as any)?.name || (node as any)?.title || "";
              const offers = (node as any)?.offers;
              if (!name || !offers) continue;
              const list = Array.isArray(offers) ? offers : [offers];
              for (const offer of list) {
                products.push({
                  name,
                  price: offer?.price ?? null,
                  currency: offer?.priceCurrency ?? "EUR",
                  img: typeof (node as any)?.image === "string" ? (node as any).image :
                       Array.isArray((node as any)?.image) ? (node as any).image[0] : undefined,
                  validTo: offer?.priceValidUntil || (node as any)?.validThrough || (node as any)?.validTo || undefined
                });
              }
            }
          }
        } catch {}
      }
      return { htmlLen: document.documentElement.outerHTML.length, items: products };
    });

    // 2) Fallback: crawl visible cards if ld+json empty
    let deals: Deal[] = [];
    if (items && items.length) {
      deals = items
        .filter(x => x.price != null)
        .map((x: any, i: number) => ({
          id: `kaufland-${String(x.name || "").slice(0,24)}-${i}`,
          store: "kaufland",
          title: x.name || "Produkt",
          price: Number(String(x.price).replace(",", ".")),
          unit: x.currency || "EUR",
          image: x.img,
          validTo: x.validTo
        }));
    } else {
      const cards = await page.$$eval("article,div", nodes => {
        // very generic fallback: look for price-like text and a name nearby
        const out: {title:string, price:number}[] = [];
        const priceRx = /(\d+[.,]\d{1,2})\s*€/;
        nodes.forEach(n => {
          const txt = (n.textContent || "").replace(/\s+/g," ").trim();
          const m = priceRx.exec(txt);
          if (m) {
            const price = parseFloat(m[1].replace(",", "."));
            const title = (n.querySelector("h2,h3,strong,span")?.textContent || "").trim() || txt.slice(0,60);
            if (title && Number.isFinite(price)) out.push({ title, price });
          }
        });
        return out.slice(0, 40);
      });
      deals = cards.map((c, i) => ({
        id: `kaufland-fb-${i}`,
        store: "kaufland",
        title: c.title,
        price: c.price,
        unit: "EUR"
      }));
    }

    return { deals, htmlLen };
  } finally {
    await browser.close();
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const store = (searchParams.get("store") || "").toLowerCase();
  const zip = searchParams.get("zip") || "60311";

  if (secret !== process.env.CRAWL_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (store !== "kaufland") {
    return NextResponse.json({ error: "unsupported store" }, { status: 400 });
  }

  // Use the generic deals page. (We avoid ?search= due to proxy issues.)
  const url = "https://www.kaufland.de/angebote/aktuell.html";
  const { deals, htmlLen } = await crawlKauflandWithPlaywright(url);

  const payload = { zip, store, deals, ts: Date.now(), htmlLen };
  // Cache 6h
  await dbSetJSON(`deals:${store}:${zip}`, payload, 60 * 60 * 6);

  return NextResponse.json({ ok: true, store, zip, count: deals.length, htmlLen });
}
