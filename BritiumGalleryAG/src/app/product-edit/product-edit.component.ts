import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProductService } from '../services/product.service';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PhotoDialogComponent } from './photo-dialog.component';
import { ProductVariantService } from '../services/product-variant.service';
import { PurchaseHistory } from '../models/product.model';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { BrandService } from '../services/brand.service';
import { Brand } from '../models/product.model';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CategoryService } from '../services/category.service';
import { CategoryAttribute } from '../category';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  standalone: false,
  styleUrls: ['./product-edit.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ProductEditComponent implements OnInit, AfterViewInit {
  product: ProductResponse | null = null;
  productForm: FormGroup;
  variantForm: FormGroup;
  stockForm: FormGroup;
  isAddingVariant = false;
  editingVariant: VariantResponse | null = null;
  selectedVariant: VariantResponse | null = null;
  previousPurchasePrice = 0;
  dataSource: MatTableDataSource<VariantResponse>;
  displayedColumns: string[] = [
    'id',
    'photos',
    'price',
    'stock',
    'attributes',
    'actions',
  ];
  isLoading = false;
  attributeSuggestions: { [key: string]: string[] } = {};
  selectedFiles: File[] = [];
  displayImageUrls: string[] = [];
  removedExistingImageUrls: string[] = [];
  Object = Object;
  isUpdating = false;
  private addVariantDialogRef: MatDialogRef<any> | null = null;
  brands: Brand[] = [];
  selectedBrandId: number | null = null;
  basePhotoFile?: File;
  basePhotoPreview?: string;
  reduceStockForm: FormGroup;
  isReducing = false;
  showCustomHistoryModal = false;
  showExportDropdownPrice = false;
  showExportDropdownPurchase = false;
  showExportDropdownReduce = false;
  @ViewChild('exportDialog') exportDialog!: TemplateRef<any>;
  dialogRef: MatDialogRef<any> | null = null;

  @ViewChild('reduceStockModal') reduceStockModal!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('editProductModal') editProductModal!: TemplateRef<any>;
  @ViewChild('addVariantModal') addVariantModal!: TemplateRef<any>;
  @ViewChild('editVariantModal') editVariantModal!: TemplateRef<any>;
  @ViewChild('addStockModal') addStockModal!: TemplateRef<any>;
  @ViewChild('historyModal') historyModal!: TemplateRef<any>;
  @ViewChild('productHistoryModal') productHistoryModal!: TemplateRef<any>;
  @ViewChild('priceSort') priceSort!: MatSort;
  @ViewChild('purchaseSort') purchaseSort!: MatSort;

  priceHistory: any[] = [];
  purchaseHistory: PurchaseHistory[] = [];
  reduceStockHistory: any[] = [];
  groupedReduceStockHistory: any[] = [];
  selectedVariantForHistory: VariantResponse | null = null;
  priceHistoryDataSource = new MatTableDataSource<any>();
  purchaseHistoryDataSource = new MatTableDataSource<PurchaseHistory>();
  reduceStockHistoryDataSource = new MatTableDataSource<any>();
  activeHistoryTab: 'price' | 'purchase' | 'reduce' | 'edit' = 'price';
  variantEditHistory: any[] = [];
  
  // Product History Properties
  productHistory: any[] = [];
  filteredProductHistory: any[] = [];
  showProductHistoryModal = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private brandService: BrandService,
    private productVariantService: ProductVariantService,
    private categoryService: CategoryService,
    private sanitizer: DomSanitizer
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.maxLength(500)],
      rating: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      brandId: [null, Validators.required],
    });

    this.variantForm = this.fb.group({
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
      attributes: this.fb.array<FormGroup>([]),
      photos: [[]],
    });

    this.stockForm = this.fb.group({
      purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
      sellingPrice: ['', [Validators.required, Validators.min(0.01)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
    });

    this.reduceStockForm = this.fb.group({
      reductions: this.fb.array<FormGroup>([]),
      reductionReason: ['', Validators.required],
    });

    this.dataSource = new MatTableDataSource<VariantResponse>([]);
  }

  get attributesFormArray(): FormArray<FormGroup> {
    return this.variantForm.get('attributes') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const productId = Number(params.get('id'));
      if (productId) {
        forkJoin([
          this.productService.getProductDetail(productId),
          this.brandService.getAllBrands(),
        ]).subscribe(([product, brands]) => {
          console.log('API product:', product);
          console.log('API brands:', brands);
          if (!product) {
            this.showError('Product not found!');
            this.isLoading = false;
            return;
          }

          this.brands = brands.map((b) => ({ ...b, id: Number(b.id) }));
          this.product = product;
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            rating: product.rating,
            brandId: product.brandId ? Number(product.brandId) : null,
          });

          this.selectedBrandId = product.brandId
            ? Number(product.brandId)
            : null;
          this.basePhotoPreview = product.basePhotoUrl || '';
          this.dataSource.data =
            product.variants.map((variant) => ({
              ...variant,
              price: Number(variant.price),
              stock: Number(variant.stock),
            })) || [];

          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
            this.dataSource.sort.sort({
              id: 'id',
              start: 'asc',
              disableClear: false,
            });
          }

          this.updateAttributeSuggestions();
          this.isLoading = false;
        });
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    this.dataSource.sortingDataAccessor = (
      item: VariantResponse,
      property: string
    ) => {
      switch (property) {
        case 'id':
          return item.id;
        case 'price':
          return item.price;
        case 'stock':
          return item.stock;
        case 'attributes':
          return Object.entries(item.attributes || {})
            .map(([key, value]) => `${key}:${value}`)
            .join(' ');
        case 'photos':
          return item.imageUrls && item.imageUrls.length > 0
            ? item.imageUrls[0]
            : '';
        case 'actions':
          return '';
        default:
          return (item as any)[property];
      }
    };

    this.priceHistoryDataSource.sortingDataAccessor = (item, property) => {
      if (property === 'date') {
        return item.priceDate ? new Date(item.priceDate).getTime() : 0;
      }
      if (property === 'price') {
        return item.price || 0;
      }
      return item[property];
    };

    this.purchaseHistoryDataSource.sortingDataAccessor = (item, property) => {
      if (property === 'date') {
        return item.purchaseDate ? new Date(item.purchaseDate).getTime() : 0;
      }
      if (property === 'purchasePrice') {
        return item.purchasePrice || 0;
      }
      return (item as any)[property];
    };

    this.updateAttributeSuggestions();
    this.isLoading = false;
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductDetail(id).subscribe({
      next: (product: ProductResponse) => {
        this.product = product;
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          rating: product.rating,
          brandId: product.brandId || null,
        });
        this.selectedBrandId = product.brandId || null;
        this.basePhotoPreview = product.basePhotoUrl || '';
        this.dataSource.data =
          product.variants.map((variant) => ({
            ...variant,
            price: Number(variant.price),
            stock: Number(variant.stock),
          })) || [];

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
          this.dataSource.sort.sort({
            id: 'id',
            start: 'asc',
            disableClear: false,
          });
        }

        this.updateAttributeSuggestions();
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading product:', error);
        this.showError('Failed to load product.');
        this.isLoading = false;
      },
    });
  }

  editProductInfo(): void {
    if (this.product) {
      this.selectedBrandId = this.product.brandId || null;
      this.basePhotoPreview = this.product.basePhotoUrl || '';
      this.productForm.patchValue({ brandId: this.selectedBrandId });
    }

    const dialogRef = this.dialog.open(this.editProductModal, {
      width: '600px',
      data: { title: 'Edit Product Information' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.saveProduct();
      }
    });
  }

  private getUniqueAttributeNames(): string[] {
    const uniqueAttributes = new Set<string>();
    this.dataSource.data.forEach((variant) => {
      Object.keys(variant.attributes).forEach((key) => {
        uniqueAttributes.add(key);
      });
    });
    return Array.from(uniqueAttributes);
  }

  addNewVariant(): void {
    this.variantForm.reset();
    this.attributesFormArray.clear();
    this.selectedFiles = [];
    this.displayImageUrls = [];
    this.removedExistingImageUrls = [];

    // Fetch all category attributes for the product's category
    if (this.product && this.product.categoryId) {
      this.categoryService.getAttributesForCategory(this.product.categoryId).subscribe((attributes: any[]) => {
        attributes.forEach((attr: any) => {
          this.attributesFormArray.push(
            this.fb.group({
              key: [attr.name, Validators.required],
              value: ['', Validators.required],
            })
          );
        });
        this.openAddVariantDialog();
      });
    } else {
      this.openAddVariantDialog();
    }
  }

  // Helper to open the add variant dialog
  private openAddVariantDialog(): void {
    this.addVariantDialogRef = this.dialog.open(this.addVariantModal, {
      width: '100vw',
      maxWidth: '100vw',
      disableClose: true,
    });
    this.addVariantDialogRef.afterClosed().subscribe(() => {
      this.addVariantDialogRef = null;
      this.isAddingVariant = false;
      this.variantForm.reset();
      this.attributesFormArray.clear();
      this.selectedFiles = [];
      this.displayImageUrls = [];
      this.removedExistingImageUrls = [];
    });
  }

  editVariant(variant: VariantResponse): void {
    this.editingVariant = { ...variant };
    this.selectedFiles = [];
    this.removedExistingImageUrls = [];
    this.displayImageUrls = [...(variant.imageUrls || [])];

    // Fetch all category attributes for the product's category
    if (this.product && this.product.categoryId) {
      this.categoryService.getAttributesForCategory(this.product.categoryId).subscribe((attributes: CategoryAttribute[]) => {
        // Create a new form for editing without purchasePrice validation
        this.variantForm = this.fb.group({
          price: [
            this.editingVariant!.price,
            [Validators.required, Validators.min(0.01)],
          ],
          stock: [
            this.editingVariant!.stock,
            [Validators.required, Validators.min(0)],
          ],
          attributes: this.fb.array<FormGroup>([]),
          photos: [[]],
        });

        const newAttributesFormArray = this.fb.array<FormGroup>([]);
        attributes.forEach((attr: CategoryAttribute) => {
          newAttributesFormArray.push(
            this.fb.group({
              key: [attr.name, Validators.required],
              value: [this.editingVariant && this.editingVariant.attributes && this.editingVariant.attributes[attr.name] ? this.editingVariant.attributes[attr.name] : '', Validators.required],
            })
          );
        });
        this.variantForm.setControl('attributes', newAttributesFormArray);
        this.cdRef.detectChanges();
      });
    }

    const dialogRef = this.dialog.open(this.editVariantModal, {
      maxWidth: '800px',
      data: { title: 'Edit Variant' },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.updateVariant();
      } else {
        this.editingVariant = null;
        // Reset the form back to the original structure for adding new variants
        this.variantForm = this.fb.group({
          price: ['', [Validators.required, Validators.min(0.01)]],
          stock: ['', [Validators.required, Validators.min(0)]],
          purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
          attributes: this.fb.array<FormGroup>([]),
          photos: [[]],
        });
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
        basePhotoUrl: this.product.basePhotoUrl,
        rating: this.productForm.value.rating,
        brandId: this.productForm.value.brandId,
      };

      formData.append(
        'product',
        new Blob([JSON.stringify(productPayload)], { type: 'application/json' })
      );

      if (this.basePhotoFile) {
        formData.append('basePhoto', this.basePhotoFile);
      }

      Swal.fire({
        title: 'Uploading...',
        text: 'Uploading product image to cloud. Please wait...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.productService.updateProduct(this.product.id, formData).subscribe({
        next: (response: ProductResponse) => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Product updated successfully',
            confirmButtonColor: '#222',
            timer: 1500,
            showConfirmButton: false
          });
          this.product = response;
          this.isLoading = false;
        },
        error: (error: Error) => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update product',
            confirmButtonColor: '#222'
          });
          console.error('Error updating product:', error);
          this.isLoading = false;
        },
      });
    }
  }

  async saveVariant(): Promise<void> {
    if (this.variantForm.invalid) {
      this.markFormGroupTouched(this.variantForm);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields and correct errors.',
        confirmButtonColor: '#222'
      });
      return;
    }
    const variantData = this.variantForm.value;
    const attributes: { [key: string]: string } = {};
    this.attributesFormArray.controls.forEach((control) => {
      const key = control.get('key')?.value;
      const value = control.get('value')?.value;
      if (key && value) {
        attributes[key] = value;
      }
    });
    variantData.attributes = attributes;
    const formData = new FormData();
    formData.append(
      'variant',
      new Blob([JSON.stringify(variantData)], { type: 'application/json' })
    );
    this.selectedFiles.forEach((file) => {
      formData.append('photos', file, file.name);
    });
    if (this.removedExistingImageUrls.length > 0) {
      formData.append(
        'removedImageUrls',
        JSON.stringify(this.removedExistingImageUrls)
      );
    }
    // Add adminId to FormData
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (loggedInUser && loggedInUser.id) {
      formData.append('adminId', loggedInUser.id.toString());
    }
    Swal.fire({
      title: 'Uploading...',
      text: 'Uploading images to cloud. Please wait...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.isUpdating = true;
    if (this.product) {
      this.productService
        .addVariantWithPhotos(this.product.id, formData)
        .subscribe({
          next: () => {
            Swal.close();
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Variant added successfully',
              confirmButtonColor: '#222',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadProduct(this.product!.id);
            this.isUpdating = false;
            if (this.addVariantDialogRef) {
              this.addVariantDialogRef.close(true);
            }
          },
          error: (error: HttpErrorResponse) => {
            Swal.close();
            let errorMessage = 'Failed to add variant. Please try again.';
            if (
              error.status === 400 &&
              error.error &&
              typeof error.error === 'string'
            ) {
              errorMessage = error.error;
            } else if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.status === 405) {
              errorMessage =
                'Server does not support POST method for this endpoint. Please check backend configuration.';
            }
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
              confirmButtonColor: '#222'
            });
            this.isUpdating = false;
          },
        });
    }
  }

  async updateVariant(): Promise<void> {
    if (
      this.editingVariant &&
      this.product &&
      this.variantForm.valid &&
      !this.isUpdating
    ) {
      this.isUpdating = true;
      this.editingVariant.price = this.variantForm.value.price;
      this.editingVariant.stock = this.variantForm.value.stock;
      const updatedAttributes: { [key: string]: string } = {};
      this.attributesFormArray.controls.forEach((control) => {
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
        imageUrls: this.editingVariant.imageUrls.filter(
          (url) => !this.removedExistingImageUrls.includes(url)
        ),
        imageUrlsToDelete: this.removedExistingImageUrls,
      };
      formData.append(
        'variant',
        new Blob([JSON.stringify(variantData)], { type: 'application/json' })
      );
      const loggedInUser = JSON.parse(
        localStorage.getItem('loggedInUser') || '{}'
      );
      if (loggedInUser && loggedInUser.id) {
        formData.append('adminId', loggedInUser.id.toString());
      }
      this.selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });
      Swal.fire({
        title: 'Uploading...',
        text: 'Uploading images to cloud. Please wait...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      this.productService
        .updateVariantWithPhotos(this.editingVariant.id, formData)
        .subscribe({
          next: (response: VariantResponse) => {
            Swal.close();
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Variant updated successfully',
              confirmButtonColor: '#222',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadProduct(this.product!.id);
            this.editingVariant = null;
            // Reset the form back to the original structure for adding new variants
            this.variantForm = this.fb.group({
              price: ['', [Validators.required, Validators.min(0.01)]],
              stock: ['', [Validators.required, Validators.min(0)]],
              purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
              attributes: this.fb.array<FormGroup>([]),
              photos: [[]],
            });
            this.attributesFormArray.clear();
            this.selectedFiles = [];
            this.displayImageUrls = [];
            this.removedExistingImageUrls = [];
            this.isUpdating = false;
          },
          error: (error: Error) => {
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to update variant',
              confirmButtonColor: '#222'
            });
            this.isUpdating = false;
          },
        });
    } else if (this.editingVariant) {
      this.markFormGroupTouched(this.variantForm);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required variant fields.',
        confirmButtonColor: '#222'
      });
    }
  }

  async deleteVariant(variant: VariantResponse): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this variant?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed && this.product) {
      this.productService.deleteVariant(variant.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Variant deleted successfully',
            confirmButtonColor: '#222',
            timer: 1500,
            showConfirmButton: false
          });
          this.loadProduct(this.product!.id);
        },
        error: (error: any) => {
          console.error('Error deleting variant:', error);
          if (error.status === 409 && error.error && error.error.code === 'VARIANT_REFERENCED') {
            Swal.fire({
              icon: 'error',
              title: 'Cannot Delete Variant',
              text: 'This variant is referenced by an order or refund and cannot be deleted.',
              confirmButtonColor: '#222'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete variant',
              confirmButtonColor: '#222'
            });
          }
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.displayImageUrls.push(e.target.result);
          this.cdRef.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removePhoto(index: number): void {
    if (index >= 0 && index < this.displayImageUrls.length) {
      const removedUrl = this.displayImageUrls[index];

      if (this.editingVariant?.imageUrls?.includes(removedUrl)) {
        this.removedExistingImageUrls.push(removedUrl);
      }

      const fileIndex = this.selectedFiles.findIndex(
        (file) => URL.createObjectURL(file) === removedUrl
      );
      if (fileIndex > -1) {
        URL.revokeObjectURL(this.selectedFiles[fileIndex] as any);
        this.selectedFiles.splice(fileIndex, 1);
      }

      this.displayImageUrls.splice(index, 1);
      this.cdRef.detectChanges();
    }
  }

  addAttribute(): void {
    const attributes = this.variantForm.get(
      'attributes'
    ) as FormArray<FormGroup>;
    if (attributes) {
      attributes.push(
        this.fb.group({
          key: ['', Validators.required],
          value: ['', Validators.required],
        })
      );
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
          if (
            !this.attributeSuggestions[key as string].includes(value as string)
          ) {
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
    return this.dataSource.data.reduce(
      (total, variant) => total + variant.stock,
      0
    );
  }

  getAveragePrice(): number {
    if (this.dataSource.data.length === 0) return 0;
    const total = this.dataSource.data.reduce(
      (sum, variant) => sum + variant.price,
      0
    );
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
    if (this.addVariantDialogRef) {
      this.addVariantDialogRef.close(false);
    }
  }

  cancelEdit(): void {
    this.editingVariant = null;
    // Reset the form back to the original structure for adding new variants
    this.variantForm = this.fb.group({
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      purchasePrice: ['', [Validators.required, Validators.min(0.01)]],
      attributes: this.fb.array<FormGroup>([]),
      photos: [[]],
    });
    this.attributesFormArray.clear();
    this.selectedFiles = [];
    this.displayImageUrls = [];
    this.removedExistingImageUrls = [];
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }

  hasValidImageUrls(imageUrls: string[]): boolean {
    return !!(
      imageUrls &&
      imageUrls.length > 0 &&
      imageUrls.some((url) => url && url.trim() !== '')
    );
  }

  isExpanded = (i: number, variant: VariantResponse) => {
    return this.editingVariant?.id === variant.id;
  };

  openPhotoDialog(url: string): void {
    this.dialog.open(PhotoDialogComponent, {
      data: { url },
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }

  trackByAttribute(index: number, item: any): number {
    return index;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  addStock(variant: VariantResponse): void {
    this.selectedVariant = variant;

    this.productService.getLatestPurchasePrice(variant.id).subscribe({
      next: (price: number) => {
        this.previousPurchasePrice = price;

        this.stockForm.patchValue({
          purchasePrice: price,
          sellingPrice: variant.price,
          quantity: 0,
        });

        const dialogRef = this.dialog.open(this.addStockModal, {
          width: '100vw',
          maxWidth: '100vw',
          height: '100vw',
          maxHeight: '100vw',

          disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result === true) {
            this.saveStock();
          }
          this.selectedVariant = null;
          this.previousPurchasePrice = 0;
          this.stockForm.reset();
        });
      },
      error: (error: Error) => {
        console.error('Error fetching previous purchase price:', error);
        this.showError('Failed to fetch previous purchase price');
      },
    });
  }

  saveStock(): void {
    if (this.stockForm.valid && this.selectedVariant) {
      this.isUpdating = true;

      const stockData = {
        variantId: this.selectedVariant.id,
        purchasePrice: this.stockForm.value.purchasePrice,
        sellingPrice: this.stockForm.value.sellingPrice,
        quantity: this.stockForm.value.quantity,
        adminId: null
      };

      const loggedInUser = JSON.parse(
        localStorage.getItem('loggedInUser') || '{}'
      );
      const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : null;
      stockData.adminId = adminId;

      this.productService.addStock(stockData, adminId).subscribe({
        next: (response: VariantResponse) => {
          this.showSuccess('Stock added successfully');
          this.loadProduct(this.product!.id);
          this.isUpdating = false;
          this.dialog.closeAll();
        },
        error: (error: Error) => {
          console.error('Error adding stock:', error);
          this.showError('Failed to add stock');
          this.isUpdating = false;
        },
      });
    }
  }

  showHistory(variant: VariantResponse): void {
    this.selectedVariantForHistory = variant;
    this.loadHistoryData(variant.id);
    this.showCustomHistoryModal = true;
  }

  closeCustomHistoryModal(): void {
    this.showCustomHistoryModal = false;
    this.selectedVariantForHistory = null;
    this.priceHistory = [];
    this.purchaseHistory = [];
    this.priceHistoryDataSource.data = [];
    this.purchaseHistoryDataSource.data = [];
    this.variantEditHistory = [];
  }

  setActiveHistoryTab(tab: 'price' | 'purchase' | 'reduce' | 'edit'): void {
    this.activeHistoryTab = tab;
    if (tab === 'edit' && this.selectedVariantForHistory) {
      this.loadEditHistory(this.selectedVariantForHistory.id);
    }
  }

  private loadHistoryData(variantId: number): void {
    this.productService.getPriceHistory(variantId).subscribe({
      next: (data: any[]) => {
        data.forEach((row) => (row.priceDate = new Date(row.priceDate)));
        this.priceHistory = data;
        this.priceHistoryDataSource.data = data;
      },
      error: (error: Error) => {
        console.error('Error loading price history:', error);
        this.showError('Failed to load price history');
      },
    });

    this.productVariantService.getPurchaseHistory(variantId).subscribe({
      next: (data: PurchaseHistory[]) => {
        this.purchaseHistory = data;
        this.purchaseHistoryDataSource.data = data;
      },
      error: (error: Error) => {
        console.error('Error loading purchase history:', error);
        this.showError('Failed to load purchase history');
      },
    });

    this.productService.getReduceStockHistory(variantId).subscribe({
      next: (data: any[]) => {
        data.forEach((row) => (row.reducedAt = new Date(row.reducedAt)));
        this.reduceStockHistory = data;
        // Robust grouping: group by reducedAt up to seconds, reductionReason, and adminId
        const pad = (n: number) => n.toString().padStart(2, '0');
        const toKey = (row: any) => {
          const d =
            row.reducedAt instanceof Date
              ? row.reducedAt
              : new Date(row.reducedAt);
          const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
          )}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
            d.getSeconds()
          )}`;
          return `${dateKey}|${row.reductionReason}|${row.adminId}`;
        };
        const groups: { [key: string]: any } = {};
        data.forEach((row) => {
          const key = toKey(row);
          if (!groups[key]) {
            groups[key] = {
              reducedAt: row.reducedAt,
              reductionReason: row.reductionReason,
              adminId: row.adminId,
              adminName: row.adminName,
              totalStockBeforeReduction: row.totalStockBeforeReduction,
              totalStockAfterReduction: row.totalStockAfterReduction,
              rows: [],
            };
          }
          groups[key].rows.push(row);
        });
        this.groupedReduceStockHistory = Object.values(groups);
        this.reduceStockHistoryDataSource.data = data;
      },
      error: (error: Error) => {
        console.error('Error loading reduce stock history:', error);
        this.showError('Failed to load reduce stock history');
      },
    });
  }

  private loadEditHistory(variantId: number): void {
    this.productService.getVariantEditHistory(variantId).subscribe({
      next: (data: any[]) => {
        this.variantEditHistory = data;
      },
      error: (error: Error) => {
        this.variantEditHistory = [];
        this.showError('Failed to load edit history');
      }
    });
  }

  onBasePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.basePhotoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.basePhotoPreview = e.target.result;
        this.cdRef.detectChanges();
      };
      reader.readAsDataURL(this.basePhotoFile);
    }
  }

  triggerProductImageUpload(): void {
    const input = document.getElementById('basePhoto') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  removeProductImage(): void {
    this.basePhotoPreview = '';
    this.basePhotoFile = undefined;
    const input = document.getElementById('basePhoto') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  openReduceStockModal(variant: VariantResponse): void {
    this.selectedVariant = variant;
    this.isReducing = false;

    this.productVariantService.getPurchaseHistory(variant.id).subscribe({
      next: (data: PurchaseHistory[]) => {
        // Only show batches with remainingQuantity > 0
        this.purchaseHistory = data.filter((row) => row.remainingQuantity > 0);

        // Check if there's any stock to reduce
        if (this.purchaseHistory.length === 0) {
          this.showError(
            'No stock available to reduce. All purchase batches have been fully consumed.'
          );
          return;
        }

        const reductionsFGs = this.purchaseHistory.map((ph) =>
          this.fb.group({
            purchaseId: [ph.id],
            quantity: [
              0,
              [Validators.min(0), Validators.max(ph.remainingQuantity)],
            ],
          })
        );

        // Ensure reductionReason is always included in the form group
        this.reduceStockForm = this.fb.group({
          reductions: this.fb.array(reductionsFGs),
          reductionReason: ['', Validators.required],
          customReason: [''], // Not required by default, only when "Other" is selected
        });

        const dialogRef = this.dialog.open(this.reduceStockModal, {
          width: '100vw',
          maxWidth: '100vw',
          disableClose: true,
          panelClass: 'reduce-stock-modal',
        });

        dialogRef.afterClosed().subscribe((result) => {
          this.selectedVariant = null;
          this.reduceStockForm.reset();
          // Reset the custom reason field specifically
          this.reduceStockForm.get('customReason')?.setValue('');
        });
      },
      error: (error: Error) => {
        this.showError('Failed to load purchase history');
      },
    });
  }

  get reductionsFormArray(): FormArray {
    return this.reduceStockForm.get('reductions') as FormArray;
  }

  getTotalReduction(): number {
    return this.reductionsFormArray?.controls.reduce(
      (sum, group) => sum + (group.get('quantity')?.value || 0),
      0
    );
  }

  incrementReduction(i: number, max: number): void {
    const ctrl = this.reductionsFormArray.at(i).get('quantity');
    if (ctrl && ctrl.value < max) {
      ctrl.setValue(ctrl.value + 1);
    }
  }

  decrementReduction(i: number): void {
    const ctrl = this.reductionsFormArray.at(i).get('quantity');
    if (ctrl && ctrl.value > 0) {
      ctrl.setValue(ctrl.value - 1);
    }
  }

  submitReduceStock(): void {
    // Custom validation for the form
    const reductionReason = this.reduceStockForm.get('reductionReason')?.value;
    const customReason = this.reduceStockForm.get('customReason')?.value;

    // If "Other" is selected, custom reason is required
    if (
      reductionReason === 'Other' &&
      (!customReason || customReason.trim() === '')
    ) {
      this.showError('Please provide a custom reason when selecting "Other"');
      return;
    }

    // Basic form validation
    if (
      this.reduceStockForm.get('reductionReason')?.valid &&
      this.selectedVariant
    ) {
      this.isReducing = true;
      const reductions = this.reductionsFormArray.controls
        .map((group) => ({
          purchaseId: group.get('purchaseId')?.value,
          quantity: group.get('quantity')?.value,
        }))
        .filter((r) => r.quantity > 0);

      const reductionReason =
        this.reduceStockForm.get('reductionReason')?.value;
      const customReason = this.reduceStockForm.get('customReason')?.value;

      // Use custom reason if "Other" is selected, otherwise use the selected reason
      const finalReason =
        reductionReason === 'Other' ? customReason : reductionReason;

      const requestBody = {
        reductions: reductions,
        reductionReason: finalReason,
      };

      // Get admin ID from localStorage
      const loggedInUser = JSON.parse(
        localStorage.getItem('loggedInUser') || '{}'
      );
      const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : null;

      if (!adminId) {
        this.showError('Admin ID not found. Please log in again.');
        this.isReducing = false;
        return;
      }

      this.productService
        .reduceStock(this.selectedVariant.id, requestBody, adminId)
        .subscribe({
          next: () => {
            this.showSuccess('Stock reduced successfully');
            if (this.product) {
              this.loadProduct(this.product.id);
            }
            this.isReducing = false;
            this.dialog.closeAll();
          },
          error: (error: Error) => {
            this.showError('Failed to reduce stock');
            this.isReducing = false;
          },
        });
    }
  }

  getQuantityControl(group: AbstractControl): FormControl {
    return group.get('quantity') as FormControl;
  }

  hasStockToReduce(variant: VariantResponse): boolean {
    // This is a simplified check - in a real implementation, you might want to
    // check the actual purchase history, but for now we'll check if stock > 0
    return variant.stock > 0;
  }

  // Common reduction reasons for dropdown
  readonly commonReductionReasons = [
    'Damaged goods',
    'Quality issues',
    'Return to supplier',
    'Expired products',
    'Lost items',
    'Theft',
    'Natural disaster',
    'System error',
    'Other',
  ];

  showCustomReasonField(): boolean {
    return this.reduceStockForm.get('reductionReason')?.value === 'Other';
  }

  // Export stubs for variant history tables
  exportPriceHistoryPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text('Product Variants History', pageWidth / 2, 15, {
      align: 'center',
    });
    // const logoBase64 = 'data:image/png;base64,REPLACE_WITH_YOUR_BASE64';
    // doc.addImage(logoBase64, 'PNG', pageWidth - 50, 5, 40, 20);
    const productId = this.product?.id || 'N/A';
    const productName = this.product?.name || 'N/A';
    const selectedVariant =
      this.selectedVariantForHistory ||
      (this.product?.variants?.length === 1 ? this.product.variants[0] : null);
    const attributesSummary =
      selectedVariant && selectedVariant.attributes
        ? Object.entries(selectedVariant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
    doc.setFontSize(12);
    doc.text(`Product ID: ${productId}`, 10, 28);
    doc.text(`Product Name: ${productName}`, 10, 36);
    doc.text(`Attributes: ${attributesSummary}`, 10, 44);
    const columns = [
      { header: 'Price', dataKey: 'price' },
      { header: 'Date', dataKey: 'priceDate' },
      { header: 'Admin', dataKey: 'adminName' },
      { header: 'Admin ID', dataKey: 'adminId' },
    ];
    const rows = this.priceHistoryDataSource.data.map((row) => ({
      price: row.price,
      priceDate: row.priceDate ? new Date(row.priceDate).toLocaleString() : '',
      adminName: row.adminName || 'N/A',
      adminId: row.adminId || 'N/A',
    }));
    autoTable(doc, {
      columns,
      body: rows,
      startY: 52,
      styles: {
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });
    doc.save('product-variants-history.pdf');
  }

  exportPriceHistoryExcel() {
    const productId = this.product?.id || 'N/A';
    const productName = this.product?.name || 'N/A';
    const selectedVariant =
      this.selectedVariantForHistory ||
      (this.product?.variants?.length === 1 ? this.product.variants[0] : null);
    const attributesSummary =
      selectedVariant && selectedVariant.attributes
        ? Object.entries(selectedVariant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
    const attributeKeys = selectedVariant
      ? Object.keys(selectedVariant.attributes || {})
      : [];
    const header = [
      ['Product Variants History'],
      [`Product ID: ${productId}`],
      [`Product Name: ${productName}`],
      [`Attributes: ${attributesSummary}`],
      [],
      // Add attribute keys as headers
      ['Price', 'Date', 'Admin', 'Admin ID', ...attributeKeys],
    ];
    const rows = this.priceHistoryDataSource.data.map((row) => {
      const baseRow = [
        row.price,
        row.priceDate ? new Date(row.priceDate).toLocaleString() : '',
        row.adminName || 'N/A',
        row.adminId || 'N/A',
        // Add attribute values
        ...attributeKeys.map((key) => selectedVariant?.attributes?.[key] || ''),
      ];
      return baseRow;
    });
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ProductVariantsHistory');
    XLSX.writeFile(wb, 'product-variants-history.xlsx');
  }

  // --- Purchase History Export ---
  exportPurchaseHistoryPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text('Product Variants History', pageWidth / 2, 15, {
      align: 'center',
    });
    // const logoBase64 = 'data:image/png;base64,REPLACE_WITH_YOUR_BASE64';
    // doc.addImage(logoBase64, 'PNG', pageWidth - 50, 5, 40, 20);
    const productId = this.product?.id || 'N/A';
    const productName = this.product?.name || 'N/A';
    const selectedVariant =
      this.selectedVariantForHistory ||
      (this.product?.variants?.length === 1 ? this.product.variants[0] : null);
    const attributesSummary =
      selectedVariant && selectedVariant.attributes
        ? Object.entries(selectedVariant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
    doc.setFontSize(12);
    doc.text(`Product ID: ${productId}`, 10, 28);
    doc.text(`Product Name: ${productName}`, 10, 36);
    doc.text(`Attributes: ${attributesSummary}`, 10, 44);
    const columns = [
      { header: 'Batch ID', dataKey: 'id' },
      { header: 'Purchase Price', dataKey: 'purchasePrice' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Remaining', dataKey: 'remainingQuantity' },
      { header: 'Date', dataKey: 'purchaseDate' },
      { header: 'Admin', dataKey: 'adminName' },
      { header: 'Admin ID', dataKey: 'adminId' },
    ];
    const rows = this.purchaseHistoryDataSource.data.map((row) => ({
      id: row.id,
      purchasePrice: row.purchasePrice,
      quantity: row.quantity,
      remainingQuantity: row.remainingQuantity,
      purchaseDate: row.purchaseDate
        ? new Date(row.purchaseDate).toLocaleString()
        : '',
      adminName: row.adminName || 'N/A',
      adminId: row.adminId || 'N/A',
    }));
    autoTable(doc, {
      columns,
      body: rows,
      startY: 52,
      styles: {
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });
    doc.save('product-variants-history.pdf');
  }

  exportPurchaseHistoryExcel() {
    const productId = this.product?.id || 'N/A';
    const productName = this.product?.name || 'N/A';
    const selectedVariant =
      this.selectedVariantForHistory ||
      (this.product?.variants?.length === 1 ? this.product.variants[0] : null);
    const attributesSummary =
      selectedVariant && selectedVariant.attributes
        ? Object.entries(selectedVariant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
    const header = [
      ['Product Variants History'],
      [`Product ID: ${productId}`],
      [`Product Name: ${productName}`],
      [`Attributes: ${attributesSummary}`],
      [],
    ];
    const rows = this.purchaseHistoryDataSource.data.map((row) => ({
      'Batch ID': row.id,
      'Purchase Price': row.purchasePrice,
      Quantity: row.quantity,
      Remaining: row.remainingQuantity,
      Date: row.purchaseDate ? new Date(row.purchaseDate).toLocaleString() : '',
      Admin: row.adminName || 'N/A',
      'Admin ID': row.adminId || 'N/A',
    }));
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ProductVariantsHistory');
    XLSX.writeFile(wb, 'product-variants-history.xlsx');
  }

  // --- Reduce Stock History Export ---
  exportReduceStockHistoryPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text('Product Variants History', pageWidth / 2, 15, {
      align: 'center',
    });
    // const logoBase64 = 'data:image/png;base64,REPLACE_WITH_YOUR_BASE64';
    // doc.addImage(logoBase64, 'PNG', pageWidth - 50, 5, 40, 20);
    const productId = this.product?.id || 'N/A';
    const productName = this.product?.name || 'N/A';
    const selectedVariant =
      this.selectedVariantForHistory ||
      (this.product?.variants?.length === 1 ? this.product.variants[0] : null);
    const attributesSummary =
      selectedVariant && selectedVariant.attributes
        ? Object.entries(selectedVariant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
    doc.setFontSize(12);
    doc.text(`Product ID: ${productId}`, 10, 28);
    doc.text(`Product Name: ${productName}`, 10, 36);
    doc.text(`Attributes: ${attributesSummary}`, 10, 44);
    const columns = [
      { header: 'Reduction Reason', dataKey: 'reductionReason' },
      { header: 'Admin', dataKey: 'adminName' },
      { header: 'Admin ID', dataKey: 'adminId' },
      { header: 'Date', dataKey: 'reducedAt' },
      { header: 'Stock Change', dataKey: 'stockChange' },
      { header: 'Details (Batches)', dataKey: 'details' },
    ];
    const rows = this.groupedReduceStockHistory.map((group) => ({
      reductionReason: group.reductionReason,
      adminName: group.adminName || 'N/A',
      adminId: group.adminId || 'N/A',
      reducedAt: group.reducedAt
        ? new Date(group.reducedAt).toLocaleString()
        : '',
      stockChange: `${group.totalStockBeforeReduction} → ${group.totalStockAfterReduction}`,
      details: (() => {
        const header = 'Batch   Qty   Purchase Price';
        const lines = (group.rows || []).map(
          (row: any) =>
            `#${row.purchaseHistoryId}   ${row.quantityReduced}   ${row.purchasePriceAtReduction}`
        );
        return [header, ...lines].join('\n');
      })(),
    }));
    autoTable(doc, {
      columns,
      body: rows,
      startY: 52,
      styles: {
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });
    doc.save('product-variants-history.pdf');
  }
  exportReduceStockHistoryExcel() {
    const productId = this.product?.id || 'N/A';
    const productName = this.product?.name || 'N/A';
    const selectedVariant =
      this.selectedVariantForHistory ||
      (this.product?.variants?.length === 1 ? this.product.variants[0] : null);
    const attributesSummary =
      selectedVariant && selectedVariant.attributes
        ? Object.entries(selectedVariant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
    const header = [
      ['Product Variants History'],
      [`Product ID: ${productId}`],
      [`Product Name: ${productName}`],
      [`Attributes: ${attributesSummary}`],
      [],
    ];
    const rows = this.groupedReduceStockHistory.map((group) => ({
      'Reduction Reason': group.reductionReason,
      Admin: group.adminName || 'N/A',
      'Admin ID': group.adminId || 'N/A',
      Date: group.reducedAt ? new Date(group.reducedAt).toLocaleString() : '',
      'Stock Change': `${group.totalStockBeforeReduction} → ${group.totalStockAfterReduction}`,
      'Details (Batches)': (() => {
        const header = 'Batch   Qty   Purchase Price';
        const lines = (group.rows || []).map(
          (row: any) =>
            `#${row.purchaseHistoryId}   ${row.quantityReduced}   ${row.purchasePriceAtReduction}`
        );
        return [header, ...lines].join('\n');
      })(),
    }));
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ProductVariantsHistory');
    XLSX.writeFile(wb, 'product-variants-history.xlsx');
  }

  openExportDialog(tab: 'price' | 'purchase' | 'reduce') {
    let exportPDF: () => void;
    let exportExcel: () => void;
    if (tab === 'price') {
      exportPDF = () => this.exportPriceHistoryPDF();
      exportExcel = () => this.exportPriceHistoryExcel();
    } else if (tab === 'purchase') {
      exportPDF = () => this.exportPurchaseHistoryPDF();
      exportExcel = () => this.exportPurchaseHistoryExcel();
    } else {
      exportPDF = () => this.exportReduceStockHistoryPDF();
      exportExcel = () => this.exportReduceStockHistoryExcel();
    }
    this.dialogRef = this.dialog.open(this.exportDialog, {
      data: { exportPDF, exportExcel },
      panelClass: 'export-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      width: '300px',
    });
  }

  // Product History Methods
  showProductHistory(): void {
    if (this.product) {
      this.loadProductHistory(this.product.id);
      this.dialog.open(this.productHistoryModal, {
        width: '1200px',
        maxHeight: '90vh',
        disableClose: false,
      });
    }
  }

  loadProductHistory(productId: number): void {
    this.productService.getProductHistory(productId).subscribe({
      next: (data: any[]) => {
        this.productHistory = data;
        this.filteredProductHistory = [...data];
      },
      error: (error: Error) => {
        console.error('Error loading product history:', error);
        this.showError('Failed to load product history');
      },
    });
  }

  formatFieldName(fieldName: string): string {
    const fieldMap: { [key: string]: string } = {
      'name': 'Product Name',
      'description': 'Description',
      'rating': 'Rating',
      'brand': 'Brand',
      'base_photo': 'Base Photo',
      'variant_price': 'Variant Price',
      'variant_stock': 'Variant Stock'
    };
    return fieldMap[fieldName] || fieldName;
  }

  // Helper to diff description changes
  getDescriptionDiff(oldValue: string, newValue: string, mode: 'old' | 'new'): SafeHtml {
    if (!oldValue && !newValue) return '';
    if (!oldValue) return mode === 'new'
      ? this.sanitizer.bypassSecurityTrustHtml(`<span class='desc-added'>${this.escapeHtml(newValue)}</span>`)
      : '';
    if (!newValue) return mode === 'old'
      ? this.sanitizer.bypassSecurityTrustHtml(`<span class='desc-removed'>${this.escapeHtml(oldValue)}</span>`)
      : '';

    // Word-level LCS diff
    const oldWords = oldValue.split(/([\s.,!?:;]+)/);
    const newWords = newValue.split(/([\s.,!?:;]+)/);
    const lcsMatrix: number[][] = Array(oldWords.length + 1).fill(null).map(() => Array(newWords.length + 1).fill(0));

    // Build LCS matrix
    for (let i = 1; i <= oldWords.length; i++) {
      for (let j = 1; j <= newWords.length; j++) {
        if (oldWords[i - 1] === newWords[j - 1]) {
          lcsMatrix[i][j] = lcsMatrix[i - 1][j - 1] + 1;
        } else {
          lcsMatrix[i][j] = Math.max(lcsMatrix[i - 1][j], lcsMatrix[i][j - 1]);
        }
      }
    }

    // Backtrack to get diff
    let result = '';
    let i = oldWords.length, j = newWords.length;
    const parts: {type: 'same'|'added'|'removed', text: string}[] = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        parts.unshift({ type: 'same', text: oldWords[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || lcsMatrix[i][j - 1] >= lcsMatrix[i - 1][j])) {
        parts.unshift({ type: 'added', text: newWords[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || lcsMatrix[i][j - 1] < lcsMatrix[i - 1][j])) {
        parts.unshift({ type: 'removed', text: oldWords[i - 1] });
        i--;
      }
    }

    for (const part of parts) {
      if (part.type === 'same') {
        result += this.escapeHtml(part.text);
      } else if (part.type === 'added' && mode === 'new') {
        result += `<span class='desc-added'>${this.escapeHtml(part.text)}</span>`;
      } else if (part.type === 'removed' && mode === 'old') {
        result += `<span class='desc-removed'>${this.escapeHtml(part.text)}</span>`;
      } else if (mode === 'old' && part.type === 'added') {
        // skip
      } else if (mode === 'new' && part.type === 'removed') {
        // skip
      }
    }
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }

  escapeHtml(text: string): string {
    return text.replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]||c));
  }
}
