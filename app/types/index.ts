export interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  condition: string;
  link: string;
  platform: 'Vinted' | 'Depop';
  brand?: string;
  size?: string;
} 