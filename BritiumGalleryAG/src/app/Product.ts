export interface Product {
  id: number;
  name: string;
  description: string;
  rating: number;
  categoryId: number; // Needed for matching
}
