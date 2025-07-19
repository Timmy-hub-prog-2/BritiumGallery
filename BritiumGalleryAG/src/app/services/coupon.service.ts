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
        // Show the real backend error message if available
        const msg = error.error?.message || error.error || error.message;
        alert(msg);
        return throwError(() => new Error(msg));
      })
    );
  }

  // getCoupons(): Observable<Coupon[]> {
  //   return this.http.get<Coupon[]>(this.baseUrl);
  // }
   // ✅ GET coupons with rules
  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.baseUrl}/with-rules`).pipe(
      catchError(this.handleError)
    );
  }
updateCouponWithRules(coupon: Coupon): Observable<any> {
  return this.http.put(`${this.baseUrl}/with-rules/${coupon.code}`, coupon).pipe(
    catchError(this.handleError)
  );
}

  updateCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.baseUrl}/${coupon.code}`, coupon);
  }

  deleteCoupon(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${code}`);
  }

  applyCoupon(code: string, userId: number, cartTotal: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/apply-coupon`, {
      couponCode: code,
      userId: userId,
      cartTotal: cartTotal
    }).pipe(
      catchError(error => {
        // Show the real backend error message if available
        const msg = error.error?.message || error.error || error.message;
        return throwError(() => new Error(msg));
      })
    );
  }
  
   // ✅ Centralized error handler
  private handleError(error: any) {
    const msg = error.error?.message || error.error || error.message || 'Something went wrong';
    alert(msg);
    return throwError(() => new Error(msg));
  }
}
