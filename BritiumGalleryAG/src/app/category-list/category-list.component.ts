import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../services/category.service';
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  productCount?: number;
  image_url?:string,
  subcategoryCount?: number;
}

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'], // ✅ Fix: "styleUrl" ➜ "styleUrls"
})
export class CategoryListComponent implements OnInit {
  urlParam: number = 0;
  // Properties
  searchTerm: string = '';
  sortBy: string = 'name';
  isLoading: boolean = false;
  categories: Category[] = [];
  filteredCategories: Category[] = [];


  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  // Load categories from service
  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log(categories);
        this.filteredCategories = [...categories];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(category =>
        category.name.toLowerCase().includes(searchLower) ||
        category.id.toLowerCase().includes(searchLower)
      );
    }
    this.applySorting();
  }

  // Sort functionality
  onSort(): void {
    this.applySorting();
  }

  private applySorting(): void {
    switch (this.sortBy) {
      case 'name':
        this.filteredCategories.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'id':
        this.filteredCategories.sort((a, b) => a.id.localeCompare(b.id));
        break;
      case 'date':
        // If you have a date field, implement date sorting here
        break;
    }
  }

  // Edit category
  editCategory(category: Category): void {
    this.router.navigate(['/categoryEdit', category.id]);
  }

  // Delete category
  deleteCategory(category: Category): void {
  Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete category "${category.name}"?`,
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
          this.categories = this.categories.filter(c => c.id !== category.id);
          this.filteredCategories = this.filteredCategories.filter(c => c.id !== category.id);
          this.isLoading = false;

          Swal.fire(
            'Deleted!',
            `Category "${category.name}" has been deleted.`,
            'success'
          );
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.isLoading = false;

          Swal.fire(
            'Error!',
            'There was an error deleting the category.', 
            'error'
          );
        }
      });
    }
  });
}

}
