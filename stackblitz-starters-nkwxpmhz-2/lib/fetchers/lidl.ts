import { Deal } from "../types";
import { getJSON } from "../http";
export const runtime = "nodejs";     // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";
export async function fetchLidl(zip: string): Promise<Deal[]> {
  // Lidl's offers API (Germany)
  const url = `https://www.lidl.de/c/angebote-aktuell/a10006436?channel=desktop&region=${zip}`;
  
  // NOTE: This is HTML; Lidl's API is hidden inside. We'll fetch raw HTML and regex out the JSON data.
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (MacroDealsBot/0.1)",
    },
  });

  const html = await res.text();

  // Extract the JSON from <script id="__NEXT_DATA__">...</script>
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
  if (!match) return [];

  const json = JSON.parse(match[1]);
  const products = json?.props?.pageProps?.pageData?.mainContent || [];

  const deals: Deal[] = [];

  for (const section of products) {
    if (!section?.articles) continue;
    for (const art of section.articles) {
      deals.push({
        id: `lidl-${art.id}`,
        store: "lidl",
        title: art.title,
        price: parseFloat(art.price.replace(",", ".")),
        unit: art.priceUnit || "",
        image: art.image || "",
        validTo: art.validUntil || undefined,
      });
    }
  }

  return deals;
}