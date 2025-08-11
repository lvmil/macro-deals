import { Deal } from '../types';
export async function fetchEdeka(zip: string): Promise<Deal[]> {
  return [
    { id: 'edeka-stub-1-' + zip, store: 'edeka', title: 'Edeka Sample A', price: 1.19, unit: 'EUR' },
    { id: 'edeka-stub-2-' + zip, store: 'edeka', title: 'Edeka Sample B', price: 1.69, unit: 'EUR' }
  ];
}