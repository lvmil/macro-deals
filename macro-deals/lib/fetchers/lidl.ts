import { Deal } from '../types';
export async function fetchLidl(zip: string): Promise<Deal[]> {
  return [
    { id: 'lidl-stub-1-' + zip, store: 'lidl', title: 'Lidl Sample A', price: 0.99, unit: 'EUR' },
    { id: 'lidl-stub-2-' + zip, store: 'lidl', title: 'Lidl Sample B', price: 1.49, unit: 'EUR' },
  ];
}
