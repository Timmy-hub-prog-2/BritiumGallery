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

getCustomers(status: string = ''): Observable<People[]> {
  let url = 'http://localhost:8080/gallery/users/customers';
  if (status) {
    url += `?status=${status}`;
  }
  return this.http.get<People[]>(url);
}
getAdmins(status: string = ''): Observable<People[]> {
   let url = 'http://localhost:8080/gallery/users/admins';
    if (status) {
    url += `?status=${status}`;
  }
  return this.http.get<People[]>(url);
}
}