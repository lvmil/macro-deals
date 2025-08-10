import { Deal } from "@/lib/types";

export async function fetchRewe(zip: string): Promise<Deal[]> {
  return [
    { id: "r1", store: "Rewe", title: "Milk 1L", price: "€1.09", unit: "1L", image: "", validTo: "2025-08-17" }
  ];
}
  try {
    // REWE flyer API — returns offers for a given ZIP
    const url = `https://shop.rewe.de/api/market-search?searchTerm=${zip}&marketChain=REWE`;
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (MacroDealsBot/1.0)"
      }
    });

    const json = await res.json();
    const marketId = json?.markets?.[0]?.wwIdent; // first market in the list

    if (!marketId) return [];

    // Get promotions for that market
    const promoUrl = `https://shop.rewe.de/api/promotions?marketCode=${marketId}`;
    const promoRes = await fetch(promoUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (MacroDealsBot/1.0)"
      }
    });

    const promoJson = await promoRes.json();
    const products = promoJson?.promotions || [];

    return products.map((p: any, idx: number) => ({
      id: `rewe-${idx}`,
      store: "rewe",
      title: p.title || p.name || "Unknown",
      price: parseFloat(p.price?.value || "0"),
      unit: p.price?.unit || "",
      image: p.image || "",
      validTo: p.endDate || undefined
    }));
  } catch (err) {
    console.error("Error fetching REWE:", err);
    return [];
  }
}
