import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryAttribute } from '../category';

interface Category {
  id: string;
  name: string;
  productCount?: number;
  subcategoryCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/category';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/list`);
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<string> {
  return this.http.delete(`${this.apiUrl}/delete/${id}`, {
    responseType: 'text' as 'text',
  });
}

  hideCategory(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/hide/${id}`, {});
  }

  unhideCategory(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/unhide/${id}`, {});
  }

  getAttributesForCategory(categoryId: number): Observable<CategoryAttribute[]> {
    return this.http.get<CategoryAttribute[]>(`${this.apiUrl}/attributes/${categoryId}`);
  }

} 