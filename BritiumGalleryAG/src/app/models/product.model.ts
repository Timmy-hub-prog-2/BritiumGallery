export interface Product {
  id: string;
  name: string;
  description: string;
  rating: number;
  categoryId: number;
  variants: ProductVariant[];
  basePhotoUrl: string;
}

export interface ProductVariant {
  id: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrls?: string;
  attributesString?: string; // For editing purposes
} 