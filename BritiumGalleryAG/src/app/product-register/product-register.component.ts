import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { ProductService } from '../services/product.service';
import { ProductRequest, VariantRequest } from '../product-request.model';
import { CategoryAttribute } from '../category';
import { MatSnackBar } from '@angular/material/snack-bar';

interface VariantCombination {
  attributes: { [key: string]: string };
  price: number;
  stock: number;
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
    basePhotoUrl: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
    private snackBar: MatSnackBar
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
      photoUrl: ''
    }));
  }

  updateAllVariants(property: 'price' | 'stock', value: number): void {
    this.variantCombinations.forEach(variant => {
      variant[property] = value;
    });
  }

  onSubmit() {
    const formData = new FormData();

    const variantsPayload = this.variantCombinations.map(variant => ({
      price: variant.price,
      stock: variant.stock,
      attributes: Object.entries(variant.attributes).reduce((acc, [attrId, value]) => {
        const attr = this.attributes.find(a => a.id === Number(attrId));
        if (attr) {
          acc[attr.name] = value;
        }
        return acc;
      }, {} as { [key: string]: string }),
      photoUrl: variant.photoUrl
    }));

    const productPayload = {
      name: this.product.name,
      description: this.product.description,
      categoryId: this.categoryId,
      adminId: 1,
      variants: variantsPayload,
      attributeOptions: Object.entries(this.attributeOptions).map(([attributeId, options]) => ({
        attributeId: +attributeId,
        options: options
      }))
    };

    formData.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));

    if (this.basePhotoFile) {
      formData.append('basePhoto', this.basePhotoFile);
    } else {
      alert('Base photo is required.');
      return;
    }

    Object.entries(this.variantFiles).forEach(([variantKey, files]) => {
      files.forEach(file => {
        formData.append('variantPhotos', file);
      });
    });

    this.productService.saveProduct(formData).subscribe({
      next: (response) => {
        console.log('Save response:', response);
        alert('Product and variants saved!');
        this.router.navigate(['/sub-category', this.categoryId]);
      },
      error: (error) => {
        console.error('Save error:', error);
        alert('Failed to save product');
      },
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
}