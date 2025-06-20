import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Coupon } from '../Coupon';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private baseUrl = 'http://localhost:8080/api/coupons';

  constructor(private http: HttpClient) {}

  createCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(this.baseUrl, coupon).pipe(
      catchError(error => {
        // Handle the error here, show a meaningful message
        if (error.status === 500 && error.error.message.includes("Coupon code already exists")) {
          alert("Coupon code already exists. Please use a different code.");
        }
        return throwError(() => new Error(error.message));
      })
    );
  }

  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.baseUrl);
  }

  updateCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.baseUrl}/${coupon.code}`, coupon);
  }

  deleteCoupon(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${code}`);
  }

  applyCoupon(code: string, userId: number, cartTotal: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/apply-coupon`, {
      couponCode: code,
      userId: userId,
      cartTotal: cartTotal
    });
  }
  
}
