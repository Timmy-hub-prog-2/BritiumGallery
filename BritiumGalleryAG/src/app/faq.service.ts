import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Faq {
  id?: number;
  question: string;
  answer: string;
  active?: boolean;
   category: string; 
  createdById?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FAQService {

 private baseUrl = 'http://localhost:8080/api/faqs';

  constructor(private http: HttpClient) {}

  getFaqs(): Observable<Faq[]> {
    return this.http.get<Faq[]>(this.baseUrl);
  }

  createFaq(faq: Faq): Observable<Faq> {
    return this.http.post<Faq>(this.baseUrl, faq);
  }

  updateFaq(id: number, faq: Faq): Observable<Faq> {
    return this.http.put<Faq>(`${this.baseUrl}/${id}`, faq);
  }

  deleteFaq(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}