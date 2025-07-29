export interface ProductResponse {
 
  id: number;
  name: string;
  description?: string;
  rating?: number;
  categoryId?: number;
  categoryName?: string;
  basePhotoUrl?: string;
  adminId?:number;
  variants: VariantResponse[];
  imageUrl?: string; // optional fallback
  brand?: string;
  brandId?:number;
  status?: number;
}

export interface VariantResponse {
  id: number;
  price: number;
  stock: number;
  imageUrls: string[];
  attributes: { [key: string]: string };
  sku: string;
  productName: string;
  discountPercent?: number | null;
  discountedPrice?: number | null;
}
