import { Deal } from '../types';
export async function fetchLidl(zip: string): Promise<Deal[]> {
  return [
    { id: 'lidl-stub-1-' + zip, store: 'lidl', title: 'Paprika 500g', price: 1.49, unit: 'EUR' },
    { id: 'lidl-stub-2-' + zip, store: 'lidl', title: 'Putenbrust 400g', price: 3.29, unit: 'EUR' },
  ];
}