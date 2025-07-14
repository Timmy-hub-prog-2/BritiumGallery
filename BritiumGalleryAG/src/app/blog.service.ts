import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlogPost } from './blog-create/blog-create.component';
@Injectable({ providedIn: 'root' })

export class BlogService {
  private apiUrl = 'http://localhost:8080/api/blogs';

  constructor(private http: HttpClient) {}

  getAll(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(this.apiUrl);
  }

  getById(id: number): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData): Observable<BlogPost> {
    return this.http.post<BlogPost>(this.apiUrl, formData);
  }

  update(id: number, formData: FormData): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setMain(id: number): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/${id}/set-main`, null);
}

}
