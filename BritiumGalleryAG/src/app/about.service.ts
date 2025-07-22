import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { About } from './about/about.component';

@Injectable({ providedIn: 'root' })
export class AboutService {
  private BASE_URL = 'http://localhost:8080/api/about';

  constructor(private http: HttpClient) {}

  getAll(): Observable<About[]> {
    return this.http.get<About[]>(this.BASE_URL);
  }

  getById(id: number): Observable<About> {
    return this.http.get<About>(`${this.BASE_URL}/${id}`);
  }

  create(formData: FormData): Observable<About> {
    return this.http.post<About>(this.BASE_URL, formData);
  }

   update(id: number, formData: FormData): Observable<About> {
    return this.http.put<About>(`${this.BASE_URL}/${id}`, formData);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
