export interface Product {
  id: string;
  name: string;
  description: string;
  rating: number;
  categoryId: number;
  variants: ProductVariant[];
  basePhotoUrl: string;
  brand?: Brand;
}

export interface ProductVariant {
  id: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrls?: string;
  attributesString?: string; // For editing purposes
}

export interface Brand {
  id: number;
  name: string;
  discount?: number;
  type: 'brand';
} 