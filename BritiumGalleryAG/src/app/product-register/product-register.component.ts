import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { ProductService } from '../services/product.service';
import { ProductRequest, VariantRequest } from '../product-request.model';
import { CategoryAttribute } from '../category';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Brand } from '../models/product.model';
import { BrandService } from '../services/brand.service';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface VariantCombination {
  attributes: { [key: string]: string };
  price: number;
  stock: number;
  purchasePrice: number;
  photoUrl?: string;
}

@Component({
  selector: 'app-product-register',
  templateUrl: './product-register.component.html',
  standalone: false,
  styleUrls: ['./product-register.component.css']
})
export class ProductRegisterComponent implements OnInit {
  categoryId: number = 0;
  attributes: CategoryAttribute[] = [];
  attributeOptions: { [attributeId: number]: string[] } = {};
  showOptionsModal: boolean = false;
  newOptions: { [attributeId: number]: string } = {};

  // Base product information
  basePrice: number = 0;
  baseStock: number = 0;
  basePurchasePrice: number = 0;
  previousPurchasePrice: number = 0;
  selectedAttributeOptions: { [attributeId: number]: string[] } = {};
  variantCombinations: VariantCombination[] = [];

  // Photo handling
  basePhotoFile?: File;
  basePhotoPreview?: string;
  variantFiles: { [key: string]: File[] } = {};
  variantPreviews: { [key: string]: string[] } = {};

  product = {
    name: '',
    description: '',
    basePhotoUrl: '',
    rating: 0
  };
 selectedFile: File | null = null;
productForm!: FormGroup;
productTypes: string[] = [];
selectedProductType: string = '';
  
  brands: Brand[] = [];
  selectedBrandId: number | null = null;

  // Loading state properties
  isLoading: boolean = false;
  loadingMessage: string = '';
  uploadProgress: number = 0;

  // Add new property for option errors
  optionErrors: { [attributeId: number]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private brandService: BrandService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.categoryId = +this.route.snapshot.paramMap.get('id')!;
    this.categoryService.getAttributesForCategory(this.categoryId).subscribe(data => {
      this.attributes = data;
      data.forEach(attr => {
        if (attr.id && attr.options) {
          this.attributeOptions[attr.id] = attr.options;
          this.selectedAttributeOptions[attr.id] = [];
        }
      });
    });
    // Fetch brands
    this.brandService.getAllBrands().subscribe(brands => {
      this.brands = brands;
    });
  }

  openOptionsModal(): void {
    this.showOptionsModal = true;
  }

  closeOptionsModal(): void {
    this.showOptionsModal = false;
    // Clear all errors when closing modal
    this.optionErrors = {};
  }

  addOption(attributeId: number): void {
    const newOption = this.newOptions[attributeId]?.trim();
    
    // Clear previous error
    this.optionErrors[attributeId] = '';

    if (!newOption) {
      this.optionErrors[attributeId] = 'Option cannot be empty';
      return;
    }

    if (!this.attributeOptions[attributeId]) {
      this.attributeOptions[attributeId] = [];
    }

    // Check for duplicates
    if (this.attributeOptions[attributeId].includes(newOption)) {
      this.optionErrors[attributeId] = 'This option already exists';
      return;
    }

    // Add the option if it's valid
    this.attributeOptions[attributeId].push(newOption);
    this.newOptions[attributeId] = '';
  }

  removeOption(attributeId: number, optionIndex: number): void {
    this.attributeOptions[attributeId].splice(optionIndex, 1);
    // Clear any errors when removing options
    this.optionErrors[attributeId] = '';
  }

  saveAttributeOptions(): void {
    // Automatically set all attributes to String type
    const attributesWithTypes = Object.entries(this.attributeOptions).map(([attributeId, options]) => ({
      id: +attributeId,
      options: options,
      dataType: 'String' // Always set to String
    }));

    // Here you would save the options to your backend
    this.closeOptionsModal();
    this.showSuccessMessage('Options Saved', 'Attribute options have been saved successfully.');
  }

  onAttributeOptionChange(attributeId: number, option: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.selectedAttributeOptions[attributeId].includes(option)) {
        this.selectedAttributeOptions[attributeId].push(option);
      }
    } else {
      const index = this.selectedAttributeOptions[attributeId].indexOf(option);
      if (index > -1) {
        this.selectedAttributeOptions[attributeId].splice(index, 1);
      }
    }

    this.generateVariantCombinations();
  }

  generateVariantCombinations(): void {
    const selectedAttributes = Object.entries(this.selectedAttributeOptions)
      .filter(([_, options]) => options.length > 0)
      .map(([id, options]) => ({ id: Number(id), options }));

    if (selectedAttributes.length === 0) {
      this.variantCombinations = [];
      return;
    }

    // Generate all possible combinations
    let combinations: { [key: string]: string }[] = [{}];

    for (const attr of selectedAttributes) {
      const newCombinations: { [key: string]: string }[] = [];
      
      for (const combination of combinations) {
        for (const option of attr.options) {
          newCombinations.push({
            ...combination,
            [attr.id.toString()]: option
          });
        }
      }
      
      combinations = newCombinations;
    }

    // Create variant combinations with base price and stock
    this.variantCombinations = combinations.map(combination => ({
      attributes: combination,
      price: this.basePrice,
      stock: this.baseStock,
      purchasePrice: this.basePurchasePrice,
      photoUrl: ''
    }));
  }

  updateAllVariants(property: 'price' | 'stock' | 'purchasePrice', value: number): void {
    this.variantCombinations.forEach(variant => {
      (variant as any)[property] = value;
    });
  }

  private startLoading(message: string) {
    this.isLoading = true;
    this.loadingMessage = message;
    this.uploadProgress = 0;
  }

  private stopLoading() {
    this.isLoading = false;
    this.loadingMessage = '';
    this.uploadProgress = 0;
  }

  private showSuccessMessage(title: string, message: string = '') {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        popup: 'swal2-black-theme'
      }
    });
  }

  private showErrorMessage(title: string, message: string = '') {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#000',
      customClass: {
        confirmButton: 'swal2-confirm-black',
        popup: 'swal2-black-theme'
      }
    });
  }

  private async showConfirmation(title: string, message: string = '', confirmText: string = 'Yes', cancelText: string = 'No') {
    const result = await Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#000',
      cancelButtonColor: '#666',
      customClass: {
        confirmButton: 'swal2-confirm-black',
        cancelButton: 'swal2-cancel-gray'
      }
    });
    return result.isConfirmed;
  }

  async onSubmit() {
    if (!this.basePhotoFile) {
      this.showErrorMessage('Photo Required', 'Base photo is required.');
      return;
    }

    this.startLoading('Saving product...');

    const formData = new FormData();
    const variantsPayload = this.variantCombinations.map(variant => ({
      price: variant.price,
      stock: variant.stock,
      purchasePrice: variant.purchasePrice,
      attributes: Object.entries(variant.attributes).reduce((acc, [attrId, value]) => {
        const attr = this.attributes.find(a => a.id === Number(attrId));
        if (attr) {
          acc[attr.name] = value;
        }
        return acc;
      }, {} as { [key: string]: string }),
      photoUrl: variant.photoUrl
    }));

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : 1;

    const productPayload = {
      name: this.product.name,
      description: this.product.description,
      categoryId: this.categoryId,
      adminId: adminId,
      rating: this.product.rating,
      variants: variantsPayload,
      attributeOptions: Object.entries(this.attributeOptions).map(([attributeId, options]) => ({
        attributeId: +attributeId,
        options: options
      })),
      brandId: this.selectedBrandId
    };

    formData.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));
    formData.append('basePhoto', this.basePhotoFile);

    Object.entries(this.variantFiles).forEach(([variantKey, files]) => {
      files.forEach(file => {
        formData.append(variantKey, file);
      });
    });

    this.productService.saveProductWithFiles(formData).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: async (response: string) => {
        await this.showSuccessMessage('Success', 'Product saved successfully!');
        this.router.navigate(['/sub-category', this.categoryId]);
      },
      error: (error: Error) => {
        console.error('Error saving product:', error);
        this.showErrorMessage('Save Failed', 'There was an error saving the product. Please try again.');
      }
    });
  }

  // Base photo selected handler
  onBasePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.basePhotoFile = input.files[0];
      // Create preview URL
      this.basePhotoPreview = URL.createObjectURL(this.basePhotoFile);
    }
  }

  // Variant photos selected handler
  onVariantPhotosSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const variantKey = `variant_${index}`;
      const currentFiles = this.variantFiles[variantKey] || [];
      const currentPreviews = this.variantPreviews[variantKey] || [];
      const newFiles = Array.from(input.files);

      // Simply add all new files
      this.variantFiles[variantKey] = [...currentFiles, ...newFiles];
      this.variantPreviews[variantKey] = [
        ...currentPreviews,
        ...newFiles.map(file => URL.createObjectURL(file))
      ];

      // Show success message
      this.showSuccessMessage('Photos Added', `${newFiles.length} photo(s) added successfully.`);
    }
  }

  // Remove a specific variant photo
  removeVariantPhoto(variantIndex: number, photoIndex: number): void {
    const variantKey = `variant_${variantIndex}`;
    if (this.variantFiles[variantKey]) {
      // Revoke the preview URL to free memory
      URL.revokeObjectURL(this.variantPreviews[variantKey][photoIndex]);
      this.variantFiles[variantKey].splice(photoIndex, 1);
      this.variantPreviews[variantKey].splice(photoIndex, 1);
    }
  }

  async removeVariant(index: number) {
    const confirmed = await this.showConfirmation(
      'Remove Variant',
      'Are you sure you want to remove this variant?'
    );

    if (confirmed) {
      // Remove the variant from combinations
      this.variantCombinations.splice(index, 1);
      
      // Clean up associated files and previews
      const variantKey = `variant_${index}`;
      if (this.variantFiles[variantKey]) {
        // Revoke all preview URLs for this variant
        this.variantPreviews[variantKey]?.forEach(preview => URL.revokeObjectURL(preview));
        delete this.variantFiles[variantKey];
        delete this.variantPreviews[variantKey];
      }
    }
  }

  // Clean up preview URLs when component is destroyed
  ngOnDestroy(): void {
    if (this.basePhotoPreview) {
      URL.revokeObjectURL(this.basePhotoPreview);
    }
    Object.values(this.variantPreviews).forEach(previewsArray => {
      previewsArray.forEach(preview => URL.revokeObjectURL(preview));
    });
  }

  downloadTemplate(categoryId: number) {
  this.http.get(`http://localhost:8080/product/export-template?categoryId=${categoryId}`, {
    responseType: 'blob'
  }).subscribe(blob => {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `category_${categoryId}_template.xlsx`; // Save with category-specific name
    link.click();
  });
}

onFileSelect(event: any) {
  this.selectedFile = event.target.files[0];
}

uploadFile() {
  if (!this.selectedFile) {
    this.showErrorMessage('File Required', 'Please select a file first.');
    return;
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  const categoryId = this.categoryId;
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
  const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : null;

  if (!adminId) {
    this.showErrorMessage('Authentication Error', 'Admin ID is missing.');
    return;
  }

  formData.append('categoryId', categoryId.toString());
  formData.append('adminId', adminId.toString());

  this.startLoading('Uploading product data...');

  this.http.post('http://localhost:8080/product/upload-products', formData, {
    reportProgress: true,
    observe: 'events'
  }).pipe(
    finalize(() => this.stopLoading())
  ).subscribe({
    next: (event: any) => {
      if (event.type === HttpEventType.UploadProgress) {
        this.uploadProgress = Math.round(100 * event.loaded / event.total);
      } else if (event instanceof HttpResponse) {
        this.showSuccessMessage('Upload Complete', 'File uploaded successfully!');
        this.selectedFile = null;
      }
    },
    error: (err) => {
      console.error('❌ Upload error:', err);
      this.showErrorMessage('Upload Failed', 'There was an error uploading your file. Please try again.');
    }
  });
}


}