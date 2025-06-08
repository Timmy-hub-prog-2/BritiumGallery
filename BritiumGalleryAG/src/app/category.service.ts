import { Injectable } from '@angular/core';
import { category, CategoryAttribute } from './category';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  baseUrl = 'http://localhost:8080/category';

  constructor(private http: HttpClient) {}

  createCategory(category: category, imageFile?: File): Observable<any> {
  const formData = new FormData();

  const categoryBlob = new Blob([JSON.stringify(category)], { type: 'application/json' });
  formData.append('category', categoryBlob);

  if (imageFile) {
    formData.append('image', imageFile);
  }

  return this.http.post(`${this.baseUrl}/save`, formData, {
    responseType: 'text' as 'json',
  });
}


  getAllCategories(): Observable<category[]> {
    return this.http.get<category[]>(`${this.baseUrl}/list`);
  }

  getSubCategories(id: number): Observable<category[]> {
    return this.http.get<category[]>(`${this.baseUrl}/getSubCat/${id}`);
  }

  updateCategory(category: category): Observable<any> {
    return this.http.put(`${this.baseUrl}/update`, category, {
      responseType: 'text' as 'json',
    });
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, {
      responseType: 'text',
    });
  }

  getCategoryById(id: number): Observable<category> {
    return this.http.get<category>(`${this.baseUrl}/${id}`);
  }
  getAttributesForCategory(categoryId: number): Observable<CategoryAttribute[]> {
    return this.http.get<CategoryAttribute[]>(`${this.baseUrl}/attributes/${categoryId}`);
  }

  
}
