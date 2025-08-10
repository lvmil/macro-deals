import { Deal } from "../types";

// TEMPORARY STUB so the build passes.
// We'll replace this with a real REWE fetch after deploy works.
export async function fetchRewe(zip: string): Promise<Deal[]> {
  return [
    {
      id: `rewe-stub-1-${zip}`,
      store: "rewe",
      title: "Milk 1L",
      price: 1.09,
      unit: "€/L",
      image: undefined,
      validTo: undefined,
    },
    {
      id: `rewe-stub-2-${zip}`,
      store: "rewe",
      title: "Bananas 1kg",
      price: 1.19,
      unit: "€/kg",
      image: undefined,
      validTo: undefined,
    },
  ];
}
