import { Deal } from '../types';
export async function fetchKaufland(zip: string): Promise<Deal[]> {
  return [
    { id: 'kaufland-stub-1-' + zip, store: 'kaufland', title: 'Kaufland Sample A', price: 0.79, unit: 'EUR' },
    { id: 'kaufland-stub-2-' + zip, store: 'kaufland', title: 'Kaufland Sample B', price: 1.29, unit: 'EUR' },
  ];
}
