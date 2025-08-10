export type Deal = {
  id: string;
  store: 'rewe' | 'lidl' | 'aldi' | 'edeka' | 'kaufland';
  title: string;
  price: number;
  unit: string;
  validTo?: string;
  image?: string;
  storeId?: string;
};
