import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseHistory } from '../models/product.model'; // adjust path as needed

@Injectable({ providedIn: 'root' })
export class ProductVariantService {
  private baseUrl = 'http://localhost:8080/product';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/variants`);
  }

  getByProduct(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${productId}/variants`);
  }

  getPurchaseHistory(variantId: number): Observable<PurchaseHistory[]> {
    return this.http.get<PurchaseHistory[]>(
      `${this.baseUrl}/variants/${variantId}/purchase-history`
    );
  }
}
