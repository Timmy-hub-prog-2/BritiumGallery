export interface ProductResponse {
 
  id: number;
  name: string;
  description: string;
  rating: number;
  categoryId: number;
  basePhotoUrl?: string;
  adminId?:number;
  variants: VariantResponse[];
  imageUrl?: string; // optional fallback
}

export interface VariantResponse {
  id: number;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrls: string[];
  attributesString?: string; // For editing purposes
  sku?: string;
  productName?: string;
}
