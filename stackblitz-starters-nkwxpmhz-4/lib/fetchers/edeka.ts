import { Deal } from "../types";

export async function fetchEdeka(zip: string): Promise<Deal[]> {
  return [
    { id: `edeka-1`, store: "edeka", title: "Skyr 500g", price: 1.29, unit: "€" },
  ];
}