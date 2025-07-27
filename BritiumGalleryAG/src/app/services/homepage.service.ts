import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomepageService {
  private baseUrl = 'http://localhost:8080/api/homepage';

  constructor(private http: HttpClient) {}

  getNewArrivals(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/new-arrivals?limit=${limit}`);
  }

  getBestSellers(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/best-sellers?limit=${limit}`);
  }

  getEventDiscountItems(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/event-discounts?limit=${limit}`);
  }

  getTopBestSellers(limit: number = 3): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/top-best-sellers?limit=${limit}`);
  }

  getEventDiscountGroups(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/event-discount-groups');
  }

  getEventDiscountGroupById(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/event-discount-groups/${eventId}`);
  }

  getTopCategories(limit: number = 4): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/top-categories?limit=${limit}`);
  }
} 