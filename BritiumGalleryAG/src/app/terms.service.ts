import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Terms {
  id?: number;
  title: string;
  content: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class TermsService {
  private baseUrl = 'http://localhost:8080/api/terms';

  constructor(private http: HttpClient) {}

  getLatestTerms(): Observable<Terms> {
    return this.http.get<Terms>(`${this.baseUrl}/latest`);
  }

  getAllTerms(): Observable<Terms[]> {
    return this.http.get<Terms[]>(this.baseUrl);
  }

  createTerms(term: Terms): Observable<Terms> {
    return this.http.post<Terms>(this.baseUrl, term);
  }

  updateTerms(id: number, term: Terms): Observable<Terms> {
    return this.http.put<Terms>(`${this.baseUrl}/${id}`, term);
  }

  deleteTerms(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
