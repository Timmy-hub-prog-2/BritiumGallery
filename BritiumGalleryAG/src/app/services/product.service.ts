import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProductRequest } from '../product-request.model';
import { Observable } from 'rxjs';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { Product } from '../Product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  baseUrl = "http://localhost:8080/product";

  constructor(private http: HttpClient) {}

  saveProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/saveWithFiles`, formData, {
      responseType: 'text' as 'json',
    });
  }

  getProductsByCategory(categoryId: number): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.baseUrl}/by-category/${categoryId}`);
  }

  getProductsByParentCategory(parentCategoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`/api/products/by-parent-category/${parentCategoryId}`);
  }

  getProductDetail(productId: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/getProductDetail/${productId}`);
  }

  getProductBreadcrumb(productId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${productId}/breadcrumb`);
  }

  updateProduct(productId: number, formData: FormData): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.baseUrl}/update/${productId}`, formData);
  }

  // Variant management methods
  addVariantWithPhotos(productId: number, formData: FormData): Observable<VariantResponse> {
    return this.http.post<VariantResponse>(`${this.baseUrl}/variants/${productId}/with-photos`, formData);
  }

  updateVariantWithPhotos(variantId: number, formData: FormData): Observable<VariantResponse> {
    return this.http.put<VariantResponse>(`${this.baseUrl}/variants/${variantId}/with-photos`, formData);
  }

  deleteVariant(variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/variants/${variantId}`);
  }
}
