export interface Product {
  id: string;
  name: string;
  description: string;
  rating: number;
  categoryId: number;
  variants: ProductVariant[];
  basePhotoUrl: string;
  brand?: string; // Brand name as string
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

export interface PurchaseHistory {
  id: number;
  purchasePrice: number;
  quantity: number;
  remainingQuantity: number;
  purchaseDate: string;
  adminName?: string;
  adminId?: number;
  variantId: number; // Added for export and variant lookup
  // ...add any other fields you use
}
