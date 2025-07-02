import { HttpClient, HttpParams } from '@angular/common/http';
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

  saveProductWithFiles(formData: FormData): Observable<any> {
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

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${productId}`);
  }

  getFilteredProducts(categoryId: number, filters: { [key: string]: string[] }): Observable<ProductResponse[]> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        filters[key].forEach(value => {
          params = params.append(key, value);
        });
      }
    }
    return this.http.get<ProductResponse[]>(`${this.baseUrl}/filtered/${categoryId}`, { params });
  }

  getCategoryAttributeOptions(categoryId: number): Observable<{ [key: string]: string[] }> {
    return this.http.get<{ [key: string]: string[] }>(`${this.baseUrl}/${categoryId}/attribute-options`);
  }

  getLatestPurchasePrice(variantId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/variants/${variantId}/latest-purchase-price`);
  }

  getPriceHistory(variantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/variants/${variantId}/price-history`);
  }

  getPurchaseHistory(variantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/variants/${variantId}/purchase-history`);
  }

  addStock(stockData: {
    variantId: number;
    purchasePrice: number;
    sellingPrice: number;
    quantity: number;
  }, adminId?: number): Observable<VariantResponse> {
    let params = new HttpParams();
    if (adminId) {
      params = params.set('adminId', adminId.toString());
    }
    return this.http.post<VariantResponse>(`${this.baseUrl}/variants/${stockData.variantId}/add-stock`, stockData, { params });
  }
}
