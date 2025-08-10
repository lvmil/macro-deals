import { Deal } from '../types';
export async function fetchAldi(zip: string): Promise<Deal[]> {
  return [
    { id: 'aldi-stub-1-' + zip, store: 'aldi', title: 'Aldi Sample A', price: 0.89, unit: 'EUR' },
    { id: 'aldi-stub-2-' + zip, store: 'aldi', title: 'Aldi Sample B', price: 1.39, unit: 'EUR' },
  ];
}
