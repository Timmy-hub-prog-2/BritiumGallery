import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopAddressService {
  private baseUrl = 'http://localhost:8080/api/shopaddresses';  // ✅ CORRECTED

  constructor(private http: HttpClient) {}

  saveAddress(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);  // ✅ POST to /shopaddresses
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);  // ✅ GET /shopaddresses
  }

  getByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`);  // ✅ /shopaddresses/user/{id}
  }

  updateAddress(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);  // ✅ PUT /shopaddresses/{id}
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);  // ✅ DELETE /shopaddresses/{id}
  }

  setMain(userId: number, addressId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/user/${userId}/main/${addressId}`, {});
  }
}