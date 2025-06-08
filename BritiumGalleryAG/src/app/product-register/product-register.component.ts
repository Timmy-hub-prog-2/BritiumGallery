import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { ProductService } from '../product.service';
import { ProductRequest, VariantRequest } from '../product-request.model';
import { CategoryAttribute } from '../category';

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

  // To store base photo file and variant files separately
  basePhotoFile?: File;
  basePhotoPreview?: string;
  variantFiles: { [key: string]: File[] } = {};
  variantPreviews: { [key: string]: string[] } = {};

  product = {
    name: '',
    description: '',
    basePhotoUrl: ''
  };

  variants: {
    price: number;
    stock: number;
    photoUrl?: string;
    attributeValues: { [attributeId: number]: string[] }
  }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Get category ID from route param
    this.categoryId = +this.route.snapshot.paramMap.get('id')!;
    // Fetch attributes for the category
    this.categoryService.getAttributesForCategory(this.categoryId).subscribe(data => {
      this.attributes = data;
      // Initialize attributeOptions with the options from backend
      data.forEach(attr => {
        if (attr.id && attr.options) {
          this.attributeOptions[attr.id] = attr.options;
        }
      });
      this.addVariant(); // Initialize with one variant
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

  removeOption(attributeId: number, index: number): void {
    this.attributeOptions[attributeId].splice(index, 1);
  }

  saveAttributeOptions(): void {
    // The options are already stored in this.attributeOptions
    this.closeOptionsModal();
  }

  addVariant() {
    this.variants.push({
      price: 0,
      stock: 0,
      photoUrl: '',
      attributeValues: {}
    });
  }

  removeVariant(index: number) {
    this.variants.splice(index, 1);
    const variantKey = `variant_${index}`;
    delete this.variantFiles[variantKey];
    delete this.variantPreviews[variantKey];
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
      this.variantFiles[variantKey] = Array.from(input.files);
      this.variantPreviews[variantKey] = Array.from(input.files).map(file => URL.createObjectURL(file));
    }
  }

  // Remove a specific variant photo
  removeVariantPhoto(variantIndex: number, photoIndex: number): void {
    const variantKey = `variant_${variantIndex}`;
    if (this.variantFiles[variantKey]) {
      this.variantFiles[variantKey].splice(photoIndex, 1);
      // Revoke the preview URL to free memory
      URL.revokeObjectURL(this.variantPreviews[variantKey][photoIndex]);
      this.variantPreviews[variantKey].splice(photoIndex, 1);
    }
  }

  // Helper function to generate all combinations of selected options
  private generateAttributeCombinations(selectedOptions: { [attributeId: number]: string[] }): { [attributeId: number]: string }[] {
    const attributeIds = Object.keys(selectedOptions).map(Number);
    if (attributeIds.length === 0) return [];

    // Start with the first attribute's options
    let combinations: { [attributeId: number]: string }[] = selectedOptions[attributeIds[0]].map(value => ({
      [attributeIds[0]]: value
    }));

    // For each remaining attribute, combine with existing combinations
    for (let i = 1; i < attributeIds.length; i++) {
      const attributeId = attributeIds[i];
      const newCombinations: { [attributeId: number]: string }[] = [];

      for (const combination of combinations) {
        for (const value of selectedOptions[attributeId]) {
          newCombinations.push({
            ...combination,
            [attributeId]: value
          });
        }
      }

      combinations = newCombinations;
    }

    return combinations;
  }

  onSubmit() {
  const formData = new FormData();

  const variantsPayload: any[] = [];

  this.variants.forEach((variant, index) => {
    const combinations = this.generateAttributeCombinations(variant.attributeValues);
    combinations.forEach(combination => {
      const attributesMap: { [key: string]: any } = {};
      for (const attr of this.attributes) {
        if (attr.id != null && combination[attr.id] != null) {
          attributesMap[attr.name] = combination[attr.id];
        }
      }

      // You might also want to attach photoUrl per variant if you process that before upload
      variantsPayload.push({
        price: variant.price,
        stock: variant.stock,
        attributes: attributesMap,
        photoUrl: '' // You can associate variant photos here if needed
      });
    });
  });

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


  // Clean up preview URLs when component is destroyed
  ngOnDestroy() {
    if (this.basePhotoPreview) {
      URL.revokeObjectURL(this.basePhotoPreview);
    }
    Object.values(this.variantPreviews).forEach(previews => {
      previews.forEach(preview => URL.revokeObjectURL(preview));
    });
  }

  // Method to track options for ngFor
  trackByOption(index: number, option: any): any {
    return option; // Or a unique ID if your option objects have one
  }

  // Method to handle checkbox changes for attribute options
  onOptionChange(event: any, variant: any, attributeId: number, option: any): void {
    const isChecked = event.target.checked;
    const attributeValues = variant.attributeValues[attributeId];

    if (isChecked) {
      // Add the option if it's not already in the array
      if (!attributeValues.includes(option)) {
        attributeValues.push(option);
      }
    } else {
      // Remove the option if it's in the array
      const index = attributeValues.indexOf(option);
      if (index !== -1) {
        attributeValues.splice(index, 1);
      }
    }
    // Ensure attributeValues is an array if it wasn't already
    if (!Array.isArray(variant.attributeValues[attributeId])) {
        variant.attributeValues[attributeId] = attributeValues;
    }

    console.log(`Variant ${variant.id} Attribute ${attributeId}: Selected options`, variant.attributeValues[attributeId]);
  }

  onCheckboxChange(attrId: number, variantIndex: number, option: string, event: Event) {
  const input = event.target as HTMLInputElement;
  const isChecked = input.checked;

  const values = this.variants[variantIndex].attributeValues[attrId] || [];

  if (isChecked) {
    if (!values.includes(option)) {
      values.push(option);
    }
  } else {
    const index = values.indexOf(option);
    if (index > -1) {
      values.splice(index, 1);
    }
  }

  this.variants[variantIndex].attributeValues[attrId] = values;
}


}