import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProductService } from '../product.service';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  standalone: false,
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit, AfterViewInit {
  product: ProductResponse | null = null;
  productForm: FormGroup;
  variantForm: FormGroup;
  isAddingVariant = false;
  editingVariant: VariantResponse | null = null;
  dataSource: MatTableDataSource<VariantResponse>;
  displayedColumns: string[] = ['price', 'stock', 'attributes', 'actions'];
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.maxLength(500)]
    });

    this.variantForm = this.fb.group({
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      attributes: this.fb.array([]) // Initialize as FormArray
    });

    this.dataSource = new MatTableDataSource<VariantResponse>([]);
  }

  get attributesFormArray(): FormArray {
    return this.variantForm.get('attributes') as FormArray;
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(Number(productId));
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductDetail(id).subscribe({
      next: (product: ProductResponse) => {
        this.product = product;
        this.productForm.patchValue({
          name: product.name,
          description: product.description
        });
        this.dataSource.data = product.variants;
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading product:', error);
        this.showError('Failed to load product details');
        this.isLoading = false;
      }
    });
  }

  saveProduct(): void {
    if (this.productForm.valid && this.product) {
      this.isLoading = true;
      const updatedProduct = {
        ...this.product,
        name: this.productForm.value.name,
        description: this.productForm.value.description
      };

      // Note: Implement updateProduct in ProductService
      console.log('Product updated:', updatedProduct);
      this.showSuccess('Product updated successfully');
      this.isLoading = false;
    } else {
      this.markFormGroupTouched(this.productForm);
    }
  }

  addNewVariant(): void {
    this.isAddingVariant = true;
    this.variantForm.reset();
    this.attributesFormArray.clear(); // Clear existing attribute controls
    this.addAttribute(); // Add an initial empty attribute field
    this.variantForm.markAsUntouched();
  }

  trackByAttribute(index: number, item: any): number {
    return index;
  }

  addAttribute(): void {
    this.attributesFormArray.push(this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    }));
  }

  removeAttribute(index: number): void {
    this.attributesFormArray.removeAt(index);
  }

  saveVariant(): void {
    if (this.variantForm.valid && this.product) {
      this.isLoading = true;
      const attributes = this.attributesFormArray.controls.reduce((acc, control) => {
        const key = control.get('key')?.value;
        const value = control.get('value')?.value;
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as { [key: string]: string });

      const newVariant: VariantResponse = {
        id: 0, // Will be assigned by the backend
        price: this.variantForm.value.price,
        stock: this.variantForm.value.stock,
        attributes: attributes,
        imageUrls: '' // Empty string for imageUrls
      };

      this.productService.addVariant(this.product.id, newVariant).subscribe({
        next: (variant) => {
          this.dataSource.data = [...this.dataSource.data, variant];
          this.isAddingVariant = false;
          this.showSuccess('Variant added successfully');
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Error adding variant:', error);
          this.showError('Failed to add variant');
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.variantForm);
    }
  }

  editVariant(variant: VariantResponse): void {
    this.editingVariant = { ...variant };
    this.editingVariant.attributesString = this.getAttributesString(variant.attributes);
  }

  updateVariant(): void {
    if (this.editingVariant && this.product) {
      this.isLoading = true;
      const attributes = this.parseAttributes(this.editingVariant.attributesString || '');
      const updatedVariant: VariantResponse = {
        ...this.editingVariant,
        attributes: attributes
      };

      this.productService.updateVariant(updatedVariant).subscribe({
        next: (variant) => {
          const index = this.dataSource.data.findIndex(v => v.id === variant.id);
          if (index !== -1) {
            this.dataSource.data[index] = variant;
            this.dataSource._updateChangeSubscription();
          }
          this.editingVariant = null;
          this.showSuccess('Variant updated successfully');
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Error updating variant:', error);
          this.showError('Failed to update variant');
          this.isLoading = false;
        }
      });
    }
  }

  deleteVariant(variant: VariantResponse): void {
    if (this.product && confirm('Are you sure you want to delete this variant?')) {
      this.isLoading = true;
      this.productService.deleteVariant(variant.id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(v => v.id !== variant.id);
          this.showSuccess('Variant deleted successfully');
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Error deleting variant:', error);
          this.showError('Failed to delete variant');
          this.isLoading = false;
        }
      });
    }
  }

  cancelAddVariant(): void {
    this.isAddingVariant = false;
    this.variantForm.reset();
    this.attributesFormArray.clear(); // Clear attribute controls on cancel
  }

  cancelEdit(): void {
    this.editingVariant = null;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getAttributesString(attributes: { [key: string]: string }): string {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  private parseAttributes(attributesString: string): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    const pairs = attributesString.split(',').map(pair => pair.trim());
    
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(item => item.trim());
      if (key && value) {
        attributes[key] = value;
      }
    });

    return attributes;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
