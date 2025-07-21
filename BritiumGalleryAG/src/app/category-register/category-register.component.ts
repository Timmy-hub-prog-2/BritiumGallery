import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../category.service';
import { category } from '../category';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-register',
  templateUrl: './category-register.component.html',
  standalone: false,
  styleUrls: ['./category-register.component.css']
})
export class CategoryRegisterComponent implements OnInit {
  selectedFile?: File;

  category: category = {
    id: 0,
    name: '',
    parent_category_id: 0,
    image_url: '',
    attributes: []
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    const parentId = this.route.snapshot.params['parentId'];
    if (parentId) {
      this.category.parent_category_id = +parentId;
    }
  }

  addAttribute(): void {
    if (!this.category.attributes) {
      this.category.attributes = [];
    }
    // Always set dataType to STRING
    this.category.attributes.push({ name: '', dataType: 'STRING' });
  }

  removeAttribute(index: number): void {
    this.category.attributes?.splice(index, 1);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  save(): void {
    if (this.validateForm()) {
      this.categoryService.createCategory(this.category, this.selectedFile).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Category created successfully!',
            timer: 2000,
            showConfirmButton: false
          }).then(() => this.navigateAfterSave());
        },
        error: (error: Error) => {
          console.error('Error creating category:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create category. Please try again.'
          });
        }
      });
    }
  }

  // Changed from private to public since it's used in the template
  navigateAfterSave(): void {
    if (this.category.parent_category_id && this.category.parent_category_id > 0) {
      this.router.navigate(['/sub-category', this.category.parent_category_id]);
    } else {
      this.router.navigate(['/categoryList']);
    }
  }

  private validateForm(): boolean {
    if (!this.category.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter a category name'
      });
      return false;
    }
    return true;
  }
}
