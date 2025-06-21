import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {

 private apiUrl = 'http://localhost:8080/api/shipping';

  constructor(private http: HttpClient) {}

  getDeliveryMethods(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/methods`);
  }
}