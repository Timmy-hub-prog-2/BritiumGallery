import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { category } from '../category';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-edit',
  standalone: false,
  templateUrl: './category-edit.component.html',
  styleUrls: ['./category-edit.component.css'],
})
export class CategoryEditComponent implements OnInit {
  categoryId?: number;
  selectedFile?: File;
  isLoading = false;
  placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  originalCategory: category | null = null;

  category: category = {
    id: 0,
    name: '',
    parent_category_id: 0,
    image_url: '',
    attributes: [],
  };

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.categoryId = +idParam;
      this.loadCategory();
    }
  }

  loadCategory(): void {
    if (this.categoryId) {
      this.isLoading = true;
      this.categoryService.getCategoryById(this.categoryId).subscribe({
        next: (data) => {
          this.category = data;
          // Store original data
          this.originalCategory = { ...data };
          // Ensure all attributes are set to STRING type
          if (this.category.attributes) {
            this.category.attributes = this.category.attributes.map(attr => ({
              ...attr,
              dataType: 'STRING'
            }));
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load category', err);
          this.showErrorAlert('Failed to load category');
          this.isLoading = false;
        },
      });
    }
  }

  addAttribute(): void {
    if (!this.category.attributes) {
      this.category.attributes = [];
    }
    this.category.attributes.push({ name: '', dataType: 'STRING' });
  }

  removeAttribute(index: number): void {
    if (this.category.attributes) {
      Swal.fire({
        title: 'Remove Attribute?',
        text: 'Are you sure you want to remove this attribute? This will also remove any associated options.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#212529',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes, remove it'
      }).then((result) => {
        if (result.isConfirmed) {
          this.category.attributes?.splice(index, 1);
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        this.category.image_url = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  navigateBack(): void {
    if (this.category.parent_category_id) {
      this.router.navigate(['/sub-category', this.category.parent_category_id]);
    } else {
      this.router.navigate(['/categoryList']);
    }
  }

  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    if (this.categoryId) {
      // Store the current image URL in case we need to revert
      const previousImageUrl = this.category.image_url;

      // Create a minimal update DTO if only the image changed
      let updateDto: category = { ...this.category };
      if (this.selectedFile && this.originalCategory) {
        // If only the image changed, send minimal data
        if (this.category.name === this.originalCategory.name &&
            this.category.parent_category_id === this.originalCategory.parent_category_id &&
            JSON.stringify(this.category.attributes) === JSON.stringify(this.originalCategory.attributes)) {
          updateDto = {
            id: this.category.id,
            name: this.category.name,
            image_url: this.category.image_url,
            parent_category_id: this.category.parent_category_id
          };
        }
      }
      
      this.categoryService.updateCategory(updateDto, this.selectedFile).subscribe({
        next: (updatedCategory) => {
          if (updatedCategory) {
            this.category = updatedCategory;
            this.showSuccessAlert('Category updated successfully');
            this.navigateBack();
          } else {
            this.category.image_url = previousImageUrl;
            this.showErrorAlert('Failed to update category');
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Update error:', err);
          // Revert the image URL on error
          this.category.image_url = previousImageUrl;
          this.showErrorAlert('Failed to update category');
          this.isLoading = false;
        },
      });
    }
  }

  private validateForm(): boolean {
    if (!this.category.name.trim()) {
      this.showWarningAlert('Please enter a category name');
      return false;
    }
    
    if (this.category.attributes) {
      for (const attr of this.category.attributes) {
        if (!attr.name.trim()) {
          this.showWarningAlert('All attributes must have a name');
          return false;
        }
      }
    }
    
    return true;
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
  }

  private showWarningAlert(message: string): void {
    Swal.fire({
      icon: 'warning',
      title: 'Warning',
      text: message
    });
  }
}
