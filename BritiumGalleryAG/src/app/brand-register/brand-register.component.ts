import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BrandService } from '../services/brand.service';
import { Brand } from '../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
      this.snackBar.open('Brand name is required', 'Close', { duration: 3000 });
      return;
    }

    if (this.isDuplicate) {
      this.snackBar.open('Brand name already exists', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    this.brandService.createBrand(this.newBrand).subscribe({
      next: (brand) => {
        this.snackBar.open('Brand created successfully!', 'Close', { duration: 3000 });
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
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  deleteBrand(brandId: number): void {
    if (confirm('Are you sure you want to delete this brand?')) {
      this.brandService.deleteBrand(brandId).subscribe({
        next: () => {
          this.snackBar.open('Brand deleted successfully!', 'Close', { duration: 3000 });
          this.loadBrands(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting brand:', error);
          this.snackBar.open('Error deleting brand', 'Close', { duration: 3000 });
        }
      });
    }
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
      this.snackBar.open('Brand name is required', 'Close', { duration: 3000 });
      return;
    }
    // Check for duplicate name (case-insensitive, excluding current brand)
    const isDuplicate = this.brands.some(b => b.name.toLowerCase() === trimmedName.toLowerCase() && b.id !== brand.id);
    if (isDuplicate) {
      this.snackBar.open('Brand name already exists', 'Close', { duration: 3000 });
      return;
    }
    this.brandService.updateBrand(brand.id, { name: trimmedName }).subscribe({
      next: (updatedBrand) => {
        this.snackBar.open('Brand updated successfully!', 'Close', { duration: 3000 });
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
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      }
    });
  }
} 