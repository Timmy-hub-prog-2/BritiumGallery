import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { ProductService } from '../services/product.service';
import { ProductRequest, VariantRequest } from '../product-request.model';
import { CategoryAttribute } from '../category';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Brand } from '../models/product.model';
import { BrandService } from '../services/brand.service';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

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
  }

  addOption(attributeId: number): void {
    if (this.newOptions[attributeId]?.trim()) {
      if (!this.attributeOptions[attributeId]) {
        this.attributeOptions[attributeId] = [];
      }
      this.attributeOptions[attributeId].push(this.newOptions[attributeId].trim());
      this.newOptions[attributeId] = '';
    }
  }

  removeOption(attributeId: number, optionIndex: number): void {
    this.attributeOptions[attributeId].splice(optionIndex, 1);
  }

  saveAttributeOptions(): void {
    // Here you would typically save the options to your backend
    this.closeOptionsModal();
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

  onSubmit() {
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

    // Get logged-in user from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : 1; // Fallback to 1 if not found

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

    if (this.basePhotoFile) {
      formData.append('basePhoto', this.basePhotoFile);
    } else {
      alert('Base photo is required.');
      return;
    }

    // Append variant photos with their corresponding variant keys
    Object.entries(this.variantFiles).forEach(([variantKey, files]) => {
      files.forEach(file => {
        formData.append(variantKey, file);
      });
    });

    this.productService.saveProductWithFiles(formData).subscribe(
      (response: string) => {
        this.snackBar.open('Product saved successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/sub-category', this.categoryId]);
      },
      (error: Error) => {
        console.error('Error saving product:', error);
        this.snackBar.open('Error saving product. Please try again.', 'Close', { duration: 3000 });
      }
    );
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

      const totalFilesAfterAdd = currentFiles.length + newFiles.length;

      if (totalFilesAfterAdd > 4) {
        const allowedNewFilesCount = 4 - currentFiles.length;
        if (allowedNewFilesCount <= 0) {
          this.snackBar.open('Maximum 4 photos allowed per variant.', 'Close', { duration: 3000 });
          return;
        }
        const filesToTake = newFiles.slice(0, allowedNewFilesCount);
        this.variantFiles[variantKey] = [...currentFiles, ...filesToTake];
        this.variantPreviews[variantKey] = [...currentPreviews, ...filesToTake.map(file => URL.createObjectURL(file))];
        this.snackBar.open(`Only ${allowedNewFilesCount} photo(s) added. Maximum 4 photos allowed per variant.`, 'Close', { duration: 3000 });

      } else {
        this.variantFiles[variantKey] = [...currentFiles, ...newFiles];
        this.variantPreviews[variantKey] = [...currentPreviews, ...newFiles.map(file => URL.createObjectURL(file))];
      }
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

  removeVariant(index: number): void {
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
  const formData = new FormData();
  formData.append('file', this.selectedFile!);  // Attach the selected file

  const categoryId = this.categoryId;  // Ensure categoryId is assigned correctly

  // Retrieve adminId from localStorage or session
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
  const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : null;

  if (!adminId) {
    this.snackBar.open('Admin ID is missing.', 'Close', { duration: 3000 });
    return;
  }

  // Add categoryId and adminId to form data
  formData.append('categoryId', categoryId.toString());
  formData.append('adminId', adminId.toString());

  // Send the file to the backend
  this.http.post('http://localhost:8080/product/upload-products', formData, {
    responseType: 'text'  // Ensure the response type matches what the backend sends
  }).subscribe({
    next: (res) => {
      console.log('✅ Upload success:', res);
      this.snackBar.open('File uploaded successfully!', 'Close', { duration: 3000 });
    },
    error: (err) => {
      console.error('❌ Upload error:', err);
      this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 3000 });
    }
  });
}


}