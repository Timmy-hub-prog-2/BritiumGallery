export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  rating: number;
  categoryId: number;
  basePhotoUrl?: string;
  variants: VariantResponse[];
  imageUrl?: string; // optional fallback
}

export interface VariantResponse {
  id: number;
  price: number;
  stock: number;
  imageUrls:string;
  attributes?: { [key: string]: string };
}
