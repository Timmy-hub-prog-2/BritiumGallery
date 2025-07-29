import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerDetailService {

   constructor(private http: HttpClient) {}
private baseUrl = 'http://localhost:8080/api/users';

 
  getPersonalInfo(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/personal`);
  }

  getOrders(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/orders`);
  }

  getRefunds(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/refunds`);
  }

  getRemainders(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/remainders`);
  }

  getWishlist(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/wishlist`);
  }
}
