import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, ElementRef, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProductService } from '../product.service';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PhotoDialogComponent } from './photo-dialog.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  standalone: false,
  styleUrls: ['./product-edit.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ProductEditComponent implements OnInit, AfterViewInit {
  product: ProductResponse | null = null;
  productForm: FormGroup;
  variantForm: FormGroup;
  isAddingVariant = false;
  editingVariant: VariantResponse | null = null;
  dataSource: MatTableDataSource<VariantResponse>;
  displayedColumns: string[] = ['id', 'price', 'stock', 'attributes', 'photos', 'actions'];
  isLoading = false;
  attributeSuggestions: { [key: string]: string[] } = {};
  selectedFiles: File[] = [];
  displayImageUrls: string[] = [];
  removedExistingImageUrls: string[] = [];
  Object = Object;
  isUpdating = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('editProductModal') editProductModal!: TemplateRef<any>;
  @ViewChild('addVariantModal') addVariantModal!: TemplateRef<any>;
  @ViewChild('editVariantModal') editVariantModal!: TemplateRef<any>;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.maxLength(500)]
    });

    this.variantForm = this.fb.group({
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      attributes: this.fb.array<FormGroup>([]),
      photos: [[]]
    });

    this.dataSource = new MatTableDataSource<VariantResponse>([]);
  }

  get attributesFormArray(): FormArray<FormGroup> {
    return this.variantForm.get('attributes') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const productId = Number(params.get('id'));
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    console.log('ngAfterViewInit: paginator', this.paginator);
    console.log('ngAfterViewInit: sort', this.sort);
    
    // Custom sorting accessor for attributes
    this.dataSource.sortingDataAccessor = (item: VariantResponse, property: string) => {
      switch (property) {
        case 'id': return item.id;
        case 'price': return item.price;
        case 'stock': return item.stock;
        case 'attributes':
          // Convert attributes object to a string for sorting
          return Object.entries(item.attributes || {}).map(([key, value]) => `${key}:${value}`).join(' ');
        case 'photos':
          // Photos column is not meaningfully sortable by default; return an empty string or the first URL.
          // For simplicity, return the first photo URL or an empty string.
          return item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : '';
        case 'actions':
          // Actions column is not sortable; return an empty string.
          return '';
        default: return (item as any)[property];
      }
    };

    this.dataSource.data.forEach((variant, index) => {
      console.log(`Variant ${index} - ID: ${variant.id}, Price: ${variant.price} (Type: ${typeof variant.price}), Stock: ${variant.stock} (Type: ${typeof variant.stock})`);
    });
    this.updateAttributeSuggestions();
    this.isLoading = false;
    console.log('Product loaded:', this.product);
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
        this.dataSource.data = product.variants.map(variant => ({
          ...variant,
          price: Number(variant.price),
          stock: Number(variant.stock)
        })) || [];

        // After data is loaded, ensure paginator and sort are re-applied
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
          // Apply default sort if needed
          this.dataSource.sort.sort({
            id: 'id', start: 'asc', disableClear: false
          });
        }
        console.log('loadProduct: dataSource.paginator', this.dataSource.paginator);
        console.log('loadProduct: dataSource.sort', this.dataSource.sort);
        
        this.updateAttributeSuggestions();
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading product:', error);
        this.showError('Failed to load product.');
        this.isLoading = false;
      }
    });
  }

  editProductInfo(): void {
    const dialogRef = this.dialog.open(this.editProductModal, {
      width: '600px',
      data: { title: 'Edit Product Information' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveProduct();
      }
    });
  }

  addNewVariant(): void {
    this.isAddingVariant = true;
    this.variantForm.reset();
    this.attributesFormArray.clear();
    this.selectedFiles = [];
    this.displayImageUrls = [];
    this.removedExistingImageUrls = [];
    
    const dialogRef = this.dialog.open(this.addVariantModal, {
      width: '800px',
      data: { title: 'Add New Variant' }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isAddingVariant = false;
      if (result) {
        this.saveVariant();
      } else {
        this.variantForm.reset();
        this.attributesFormArray.clear();
      }
    });
  }

  editVariant(variant: VariantResponse): void {
    this.editingVariant = { ...variant };
    this.selectedFiles = [];
    this.removedExistingImageUrls = [];
    this.displayImageUrls = [...(variant.imageUrls || [])];
    console.log('editVariant: Initial displayImageUrls', this.displayImageUrls);

    this.variantForm.reset();

    this.variantForm.patchValue({
      price: this.editingVariant.price,
      stock: this.editingVariant.stock,
    });

    const newAttributesFormArray = this.fb.array<FormGroup>([]);
    if (this.editingVariant.attributes) {
      Object.entries(this.editingVariant.attributes).forEach(([key, value]) => {
        newAttributesFormArray.push(this.fb.group({
          key: [key, Validators.required],
          value: [value, Validators.required]
        }));
      });
    }
    this.variantForm.setControl('attributes', newAttributesFormArray);

    this.cdRef.detectChanges();

    const dialogRef = this.dialog.open(this.editVariantModal, {
      width: '800px',
      data: { title: 'Edit Variant' },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.updateVariant();
      } else {
        this.editingVariant = null;
        this.variantForm.reset();
        this.attributesFormArray.clear();
        this.selectedFiles = [];
        this.displayImageUrls = [];
        this.removedExistingImageUrls = [];
      }
    });
  }

  saveProduct(): void {
    if (this.productForm.valid && this.product) {
      this.isLoading = true;
      const formData = new FormData();
      
      const productPayload = {
        name: this.productForm.value.name,
        description: this.productForm.value.description,
        categoryId: this.product.categoryId,
        adminId: this.product.adminId,
        basePhotoUrl: this.product.basePhotoUrl
      };

      formData.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));

      if (this.selectedFiles.length > 0) {
        formData.append('basePhoto', this.selectedFiles[0]);
      }

      this.productService.updateProduct(this.product.id, formData).subscribe({
        next: (response: ProductResponse) => {
          this.product = response;
          this.showSuccess('Product updated successfully');
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Error updating product:', error);
          this.showError('Failed to update product');
          this.isLoading = false;
        }
      });
    }
  }

  saveVariant(): void {
    if (this.variantForm.valid) {
      const formData = new FormData();
      const variantData = {
        price: this.variantForm.value.price,
        stock: this.variantForm.value.stock,
        attributes: this.variantForm.value.attributes
      };

      formData.append('variant', new Blob([JSON.stringify(variantData)], { type: 'application/json' }));
      this.selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      if (this.product) {
        this.productService.addVariantWithPhotos(this.product.id, formData).subscribe({
          next: (response: VariantResponse) => {
            this.showSuccess('Variant added successfully');
            this.loadProduct(this.product!.id);
            this.isAddingVariant = false;
          },
          error: (error: Error) => {
            console.error('Error adding variant:', error);
            this.showError('Failed to add variant');
          }
        });
      }
    }
  }

  updateVariant(): void {
    if (this.editingVariant && this.product && this.variantForm.valid && !this.isUpdating) {
      this.isUpdating = true;
      
      this.editingVariant.price = this.variantForm.value.price;
      this.editingVariant.stock = this.variantForm.value.stock;
      
      const updatedAttributes: { [key: string]: string } = {};
      this.attributesFormArray.controls.forEach(control => {
        const key = control.get('key')?.value;
        const value = control.get('value')?.value;
        if (key && value) {
          updatedAttributes[key] = value;
        }
      });
      this.editingVariant.attributes = updatedAttributes;

      const formData = new FormData();
      
      const variantData = {
        id: this.editingVariant.id,
        price: this.editingVariant.price,
        stock: this.editingVariant.stock,
        attributes: this.editingVariant.attributes,
        imageUrls: (this.editingVariant.imageUrls as string[]).filter((url: string) => !this.removedExistingImageUrls.includes(url)),
        imageUrlsToDelete: this.removedExistingImageUrls
      };
      console.log('updateVariant: Sending variantData', variantData);
      formData.append('variant', new Blob([JSON.stringify(variantData)], { type: 'application/json' }));
      
      this.selectedFiles.forEach(file => {
        formData.append('photos', file);
      });
      console.log('updateVariant: Sending selectedFiles', this.selectedFiles);

      this.productService.updateVariantWithPhotos(this.editingVariant.id, formData).subscribe({
        next: (response: VariantResponse) => {
          this.showSuccess('Variant updated successfully');
          console.log('updateVariant: Backend response', response);
          this.loadProduct(this.product!.id);
          this.editingVariant = null;
          this.variantForm.reset();
          this.attributesFormArray.clear();
          this.selectedFiles = [];
          this.displayImageUrls = [];
          this.removedExistingImageUrls = [];
          this.isUpdating = false;
        },
        error: (error: Error) => {
          console.error('Error updating variant:', error);
          this.showError('Failed to update variant');
          this.isUpdating = false;
        }
      });
    } else if (this.editingVariant) {
      this.markFormGroupTouched(this.variantForm);
      this.showError('Please fill in all required variant fields.');
    }
  }

  deleteVariant(variant: VariantResponse): void {
    if (confirm('Are you sure you want to delete this variant?')) {
      if (this.product) {
        this.productService.deleteVariant(variant.id).subscribe({
          next: () => {
            this.showSuccess('Variant deleted successfully');
            this.loadProduct(this.product!.id);
          },
          error: (error: Error) => {
            console.error('Error deleting variant:', error);
            this.showError('Failed to delete variant');
          }
        });
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      console.log('onFileSelected: New files selected', newFiles);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      console.log('onFileSelected: selectedFiles after adding new files', this.selectedFiles);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.displayImageUrls.push(e.target.result);
          console.log('onFileSelected: displayImageUrls after adding new preview', this.displayImageUrls);
          this.cdRef.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removePhoto(index: number): void {
    console.log('removePhoto: Attempting to remove photo at index', index);
    console.log('removePhoto: Current displayImageUrls', this.displayImageUrls);
    console.log('removePhoto: Current selectedFiles', this.selectedFiles);
    console.log('removePhoto: Current removedExistingImageUrls (before removal)', this.removedExistingImageUrls);

    if (index >= 0 && index < this.displayImageUrls.length) {
      const removedUrl = this.displayImageUrls[index];
      console.log('removePhoto: URL to be removed', removedUrl);
      
      if (this.editingVariant?.imageUrls?.includes(removedUrl)) {
        this.removedExistingImageUrls.push(removedUrl);
        console.log('removePhoto: Added to removedExistingImageUrls', this.removedExistingImageUrls);
      }
      
      const fileIndex = this.selectedFiles.findIndex(file => URL.createObjectURL(file) === removedUrl);
      if (fileIndex > -1) {
        URL.revokeObjectURL(this.selectedFiles[fileIndex] as any);
        this.selectedFiles.splice(fileIndex, 1);
        console.log('removePhoto: Removed from selectedFiles', this.selectedFiles);
      } else {
        console.log('removePhoto: URL not found in selectedFiles, assuming existing URL.');
      }

      this.displayImageUrls.splice(index, 1);
      console.log('removePhoto: displayImageUrls after splicing', this.displayImageUrls);
      this.cdRef.detectChanges();
    } else {
      console.warn('removePhoto: Invalid index or displayImageUrls array length.');
    }
  }

  addAttribute(): void {
    const attributes = this.variantForm.get('attributes') as FormArray<FormGroup>;
    console.log('attributesFormArray state:', attributes);
    if (attributes) {
      attributes.push(this.fb.group({
        key: ['', Validators.required],
        value: ['', Validators.required]
      }));
    } else {
      console.error('Error: attributes FormArray is null or undefined when trying to add attribute.');
    }
  }

  removeAttribute(index: number): void {
    this.attributesFormArray.removeAt(index);
  }

  removeEditingAttribute(key: string): void {
    if (this.editingVariant) {
      delete this.editingVariant.attributes[key];
      this.editingVariant = { ...this.editingVariant };
    }
  }

  onAttributeKeyChange(index: number): void {
    const key = this.attributesFormArray.at(index).get('key')?.value;
    if (key && this.attributeSuggestions[key]) {
      this.updateAttributeSuggestions();
    }
  }

  updateAttributeSuggestions(): void {
    if (this.product) {
      this.product.variants.forEach((variant: VariantResponse) => {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!this.attributeSuggestions[key as string]) {
            this.attributeSuggestions[key as string] = [];
          }
          if (!this.attributeSuggestions[key as string].includes(value as string)) {
            this.attributeSuggestions[key as string].push(value as string);
          }
        });
      });
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getTotalStock(): number {
    return this.dataSource.data.reduce((total, variant) => total + variant.stock, 0);
  }

  getAveragePrice(): number {
    if (this.dataSource.data.length === 0) return 0;
    const total = this.dataSource.data.reduce((sum, variant) => sum + variant.price, 0);
    return total / this.dataSource.data.length;
  }

  trackByVariant(index: number, variant: VariantResponse): number {
    return variant.id;
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
  }

  cancelAddVariant(): void {
    this.isAddingVariant = false;
    this.variantForm.reset();
    this.attributesFormArray.clear();
    this.selectedFiles = [];
    this.displayImageUrls = [];
    this.removedExistingImageUrls = [];
  }

  cancelEdit(): void {
    this.editingVariant = null;
    this.variantForm.reset();
    this.attributesFormArray.clear();
    this.selectedFiles = [];
    this.displayImageUrls = [];
    this.removedExistingImageUrls = [];
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  hasValidImageUrls(imageUrls: string[]): boolean {
    return !!(imageUrls && imageUrls.length > 0 && imageUrls.some(url => url && url.trim() !== ''));
  }

  isExpanded = (i: number, variant: VariantResponse) => {
    return this.editingVariant?.id === variant.id;
  }

  openPhotoDialog(url: string): void {
    this.dialog.open(PhotoDialogComponent, {
      data: { url },
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  trackByAttribute(index: number, item: any): number {
    return index;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
