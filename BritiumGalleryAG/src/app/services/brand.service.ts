import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Brand } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private baseUrl = 'http://localhost:8080/api/brands';

  constructor(private http: HttpClient) {}

  getAllBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.baseUrl);
  }

  createBrand(brand: { name: string }): Observable<Brand> {
    return this.http.post<Brand>(this.baseUrl, brand);
  }

  deleteBrand(brandId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${brandId}`);
  }

  updateBrand(brandId: number, brand: { name: string }): Observable<Brand> {
    return this.http.put<Brand>(`${this.baseUrl}/${brandId}`, brand);
  }
} 