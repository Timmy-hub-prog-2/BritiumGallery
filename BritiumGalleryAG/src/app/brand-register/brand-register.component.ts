import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BrandService } from '../services/brand.service';
import { Brand } from '../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-brand-register',
  templateUrl: './brand-register.component.html',
  styleUrls: ['./brand-register.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class BrandRegisterComponent implements OnInit {
  brands: Brand[] = [];
  newBrand = {
    name: ''
  };
  isSubmitting = false;
  existingBrandNames: string[] = [];
  isDuplicate = false;
  editingBrandId: number | null = null;
  editBrandName: string = '';

  constructor(
    private brandService: BrandService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.existingBrandNames = brands.map(brand => brand.name.toLowerCase());
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.snackBar.open('Error loading brands', 'Close', { duration: 3000 });
      }
    });
  }

  onBrandNameChange(): void {
    if (this.newBrand.name.trim()) {
      const brandNameLower = this.newBrand.name.trim().toLowerCase();
      this.isDuplicate = this.existingBrandNames.includes(brandNameLower);
    } else {
      this.isDuplicate = false;
    }
  }
onSubmit(): void {
  if (!this.newBrand.name.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Brand Name',
      text: 'Brand name is required',
    });
    return;
  }

  if (this.isDuplicate) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Brand',
      text: 'Brand name already exists',
    });
    return;
  }

  this.isSubmitting = true;
  this.brandService.createBrand(this.newBrand).subscribe({
    next: (brand) => {
      Swal.fire({
        icon: 'success',
        title: 'Brand Created',
        text: 'Brand created successfully!',
        timer: 2000,
        showConfirmButton: false,
      });
      this.newBrand.name = '';
      this.isDuplicate = false;
      this.loadBrands(); // Reload the list
      this.isSubmitting = false;
    },
    error: (error) => {
      console.error('Error creating brand:', error);
      let errorMessage = 'Error creating brand';
      if (error.status === 409) {
        errorMessage = 'Brand name already exists';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });

      this.isSubmitting = false;
    }
  });
}


 deleteBrand(brandId: number): void {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You won\'t be able to revert this!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      this.brandService.deleteBrand(brandId).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The brand has been deleted successfully.',
            confirmButtonText: 'OK'
          });
          this.loadBrands(); // Reload the list after deletion
        },
        error: (error) => {
          console.error('Error deleting brand:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'There was an issue deleting the brand. Please try again.',
            confirmButtonText: 'OK'
          });
        }
      });
    }
  });
}


  goBack(): void {
    this.router.navigate(['/admin']);
  }

  startEdit(brand: Brand): void {
    this.editingBrandId = brand.id;
    this.editBrandName = brand.name;
  }

  cancelEdit(): void {
    this.editingBrandId = null;
    this.editBrandName = '';
  }

 saveEdit(brand: Brand): void {
  const trimmedName = this.editBrandName.trim();
  if (!trimmedName) {
    Swal.fire({
      icon: 'error',
      title: 'Brand name is required',
      text: 'Please enter a valid brand name.',
      confirmButtonText: 'OK'
    });
    return;
  }

  // Check for duplicate name (case-insensitive, excluding current brand)
  const isDuplicate = this.brands.some(b => b.name.toLowerCase() === trimmedName.toLowerCase() && b.id !== brand.id);
  if (isDuplicate) {
    Swal.fire({
      icon: 'warning',
      title: 'Brand name already exists',
      text: 'The brand name you entered already exists. Please choose another name.',
      confirmButtonText: 'OK'
    });
    return;
  }

  this.brandService.updateBrand(brand.id, { name: trimmedName }).subscribe({
    next: (updatedBrand) => {
      Swal.fire({
        icon: 'success',
        title: 'Brand updated successfully!',
        text: 'The brand has been updated.',
        confirmButtonText: 'OK'
      });
      this.editingBrandId = null;
      this.editBrandName = '';
      this.loadBrands();
    },
    error: (error) => {
      console.error('Error updating brand:', error);
      let errorMessage = 'Error updating brand';
      if (error.status === 409) {
        errorMessage = 'Brand name already exists';
      }
      Swal.fire({
        icon: 'error',
        title: 'Error updating brand',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  });
}
}