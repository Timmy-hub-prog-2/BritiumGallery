import { Injectable } from '@angular/core';
import { category, CategoryAttribute } from './category';
import { Observable, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, mergeMap, catchError } from 'rxjs/operators';

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

  getAllSubCategories(parentId: number): Observable<category[]> {
    return this.getSubCategories(parentId).pipe(
      mergeMap((categories: category[]) => {
        if (!categories || categories.length === 0) {
          return of([]);
        }

        // Get subcategories for each category
        const subCategoryObservables = categories.map(cat =>
          this.getSubCategories(cat.id).pipe(
            catchError(() => of([])) // Handle errors for individual requests
          )
        );

        // Combine all results
        return forkJoin([of(categories), ...subCategoryObservables]).pipe(
          map(results => {
            const [parentCategories, ...childCategories] = results;
            // Flatten the array and remove duplicates
            const allCategories = [...parentCategories];
            childCategories.forEach(subCats => {
              subCats.forEach(subCat => {
                if (!allCategories.find(c => c.id === subCat.id)) {
                  allCategories.push(subCat);
                }
              });
            });
            return allCategories;
          })
        );
      })
    );
  }

  updateCategory(category: category, imageFile?: File): Observable<category> {
    const formData = new FormData();
    const categoryBlob = new Blob([JSON.stringify(category)], { type: 'application/json' });
    formData.append('category', categoryBlob);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.put<category>(`${this.baseUrl}/update`, formData);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, {
      responseType: 'text',
    });
  }

  hideCategory(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/hide/${id}`, {});
  }

  getCategoryById(id: number): Observable<category> {
    return this.http.get<category>(`${this.baseUrl}/${id}`);
  }

  getAttributesForCategory(categoryId: number): Observable<CategoryAttribute[]> {
    return this.http.get<CategoryAttribute[]>(`${this.baseUrl}/attributes/${categoryId}`);
  }

  updateAttributeOptions(attributeId: number, options: string[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/attribute/${attributeId}/options`, options, {
      responseType: 'text' as 'json'
    });
  }

  addAttributeOption(attributeId: number, option: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/attribute/${attributeId}/option`, { option }, {
      responseType: 'text' as 'json'
    });
  }

  removeAttributeOption(attributeId: number, option: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/attribute/${attributeId}/option/${encodeURIComponent(option)}`, {
      responseType: 'text' as 'json'
    });
  }

  getCategoryPath(id: number): Observable<category[]> {
    return this.http.get<category[]>(`${this.baseUrl}/path/${id}`);
  }

  unhideCategory(id: number): Observable<any> {
  return this.http.put(`${this.baseUrl}/unhide/${id}`, {});
}
}
