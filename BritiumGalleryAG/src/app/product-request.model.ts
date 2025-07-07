export interface ProductRequest {
  name: string;
  description: string;
  categoryId: number;
  adminId: number;
  basePhotoUrl: string,
  variants: VariantRequest[];
  brandId?: number;
}

export interface VariantRequest {
  price: number;
  stock: number;
  photoUrl?: string;
  attributes: { [key: string]: string };
}

export interface VariantAttributeValue {
  attributeId: number;
  value: string | number | boolean;
}
