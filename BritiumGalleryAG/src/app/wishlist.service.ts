import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private apiUrl = 'http://localhost:8080/api/wishlist';

  constructor(private http: HttpClient) {}

  getAllWishlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  getWishlistByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }

  // ✅ Add this method
 addWishlistItem(userId: number, productId: number): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/add?userId=${userId}&productId=${productId}`, {});
}

removeWishlistItem(userId: number, productId: number): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/remove?userId=${userId}&productId=${productId}`);
}

}
