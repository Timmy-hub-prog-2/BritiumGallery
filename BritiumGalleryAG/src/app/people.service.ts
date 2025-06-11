import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { People } from './People';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeopleService {

  private baseUrl = 'http://localhost:8080/gallery/users';

  constructor(private http: HttpClient) {}

  // Get all customers
  getCustomers(): Observable<People[]> {
    return this.http.get<People[]>(`${this.baseUrl}/customers`);
  }

  getAdmins(): Observable<People[]> {
    return this.http.get<People[]>(`${this.baseUrl}/admins`);
  }
}