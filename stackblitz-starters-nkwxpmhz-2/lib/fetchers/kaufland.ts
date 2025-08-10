import { Deal } from "../types";

export async function fetchKaufland(zip: string): Promise<Deal[]> {
  return [
    { id: `kaufland-1`, store: "kaufland", title: "Bananas 1kg", price: 1.19, unit: "€" },
  ];
}