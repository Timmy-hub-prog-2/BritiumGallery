import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../services/category.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Define the service response type
interface CategoryResponse {
  id: string;
  name: string;
  parent_category_id?: number;
  image_url?: string;
  created_at?: string;
  admin_id?: number;
}

// Define our extended type for the component
interface CategoryWithCount extends CategoryResponse {
  productCount?: number;
  subcategoryCount?: number;
}

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit, OnDestroy {
  urlParam: number = 0;
  searchTerm: string = '';
  sortBy: string = 'name';
  isLoading: boolean = false;
  categories: CategoryWithCount[] = [];
  filteredCategories: CategoryWithCount[] = [];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performSearch();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories: CategoryResponse[]) => {
        // Convert categories to CategoryWithCount and filter parent categories
        this.categories = categories
          .filter(cat => !cat.parent_category_id)
          .map(cat => ({
            ...cat,
            productCount: 0,
            subcategoryCount: categories.filter(c => c.parent_category_id === Number(cat.id)).length
          }));
        this.filteredCategories = [...this.categories];
        this.applySorting(); // Apply initial sorting
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Categories',
          text: 'There was an error loading the categories. Please try again.'
        });
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredCategories = [...this.categories];
    this.applySorting();
  }

  private performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
    } else {
      const searchTerms = this.searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
      
      this.filteredCategories = this.categories.filter(category => {
        const categoryName = category.name.toLowerCase();
        const categoryId = category.id.toString().toLowerCase();
        
        // Check if all search terms are found in either name or ID
        return searchTerms.every(term => 
          categoryName.includes(term) || categoryId.includes(term)
        );
      });
    }
    this.applySorting();
  }

  onSort(): void {
    this.applySorting();
  }

  private applySorting(): void {
    switch (this.sortBy) {
      case 'name':
        this.filteredCategories.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'id':
        this.filteredCategories.sort((a, b) => Number(a.id) - Number(b.id));
        break;
      case 'date':
        if (this.filteredCategories[0]?.created_at) {
          this.filteredCategories.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // Most recent first
          });
        }
        break;
    }
  }

  editCategory(category: CategoryWithCount): void {
    this.router.navigate(['/categoryEdit', category.id]);
  }

  deleteCategory(category: CategoryWithCount): void {
    Swal.fire({
      title: 'Delete Parent Category?',
      text: `This will delete "${category.name}" and all its subcategories. Are you sure?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            // Remove from both arrays
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.filteredCategories = this.filteredCategories.filter(c => c.id !== category.id);
            this.isLoading = false;

            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `Category "${category.name}" and its subcategories have been deleted.`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.isLoading = false;

            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'There was an error deleting the category and its subcategories.'
            });
          }
        });
      }
    });
  }
}
