import { Deal } from "../types";

export async function fetchRewe(zip: string): Promise<Deal[]> {
  return [
    { id: `rewe-1`, store: "rewe", title: "Chicken breast", price: 5.99, unit: "€/kg" },
  ];
}