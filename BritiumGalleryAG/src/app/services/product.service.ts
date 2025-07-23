import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProductRequest } from '../product-request.model';
import { Observable, forkJoin, of } from 'rxjs';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { Product } from '../Product';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { CategoryService } from '../category.service';

export interface ProductRecommendation {
  productId: number;
  productName: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  baseUrl = "http://localhost:8080/product";

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService
  ) {}

  saveProductWithFiles(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/saveWithFiles`, formData, {
      responseType: 'text' as 'json',
    });
  }

  getProductsByCategory(categoryId: number): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.baseUrl}/by-category/${categoryId}`);
  }

  getAllProductsUnderCategory(categoryId: number): Observable<ProductResponse[]> {
    // First get all subcategories recursively
    return this.categoryService.getAllSubCategories(categoryId).pipe(
      mergeMap(categories => {
        // Get products for each category including the parent
        const categoryIds = [categoryId, ...categories.map(c => c.id)];
        const productObservables = categoryIds.map(id =>
          this.getProductsByCategory(id).pipe(
            catchError(() => of([])) // Handle errors for individual requests
          )
        );

        // Combine all results
        return forkJoin(productObservables).pipe(
          map(results => {
            // Flatten the array and remove duplicates
            const allProducts: ProductResponse[] = [];
            results.forEach(products => {
              products.forEach(product => {
                if (!allProducts.find(p => p.id === product.id)) {
                  allProducts.push(product);
                }
              });
            });
            return allProducts;
          })
        );
      })
    );
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

  getFilteredProducts(categoryId: number, filters: { [key: string]: string[] }, searchTerm?: string): Observable<ProductResponse[]> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        filters[key].forEach(value => {
          params = params.append(key, value);
        });
      }
    }
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('search', searchTerm.trim());
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

  getVariantById(variantId: number): Observable<VariantResponse> {
    return this.http.get<VariantResponse>(`${this.baseUrl}/variants/${variantId}`);
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

  reduceStock(variantId: number, body: { reductions: { purchaseId: number, quantity: number }[], reductionReason?: string }, adminId?: number) {
    let params = new HttpParams();
    if (adminId) {
      params = params.set('adminId', adminId.toString());
    }
    return this.http.post(`${this.baseUrl}/variants/${variantId}/reduce-stock`, body, { params });
  }

  getReduceStockHistory(variantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/variants/${variantId}/reduce-stock-history`);
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/all`);
  }

  getBrandsForCategory(categoryId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${categoryId}/brands`);
  }

  getMinMaxPriceForCategory(categoryId: number): Observable<{ min: number, max: number }> {
    return this.http.get<{ min: number, max: number }>(`${this.baseUrl}/${categoryId}/price-range`);
  }

  getRecommendedProducts(productId: number, limit: number = 8): Observable<ProductRecommendation[]> {
    return this.http.get<ProductRecommendation[]>(`${this.baseUrl}/${productId}/recommendations?limit=${limit}`);
  }
}
