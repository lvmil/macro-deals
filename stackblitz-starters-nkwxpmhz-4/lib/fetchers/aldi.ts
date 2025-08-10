import { Deal } from "../types";

export async function fetchAldi(zip: string): Promise<Deal[]> {
  return [
    { id: `aldi-1`, store: "aldi", title: "Basmati rice 1kg", price: 1.79, unit: "€" },
  ];
}