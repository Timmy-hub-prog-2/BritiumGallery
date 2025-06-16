import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { AuthService } from '../AuthService';
import { WishlistService } from '../wishlist.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { CartService, CartItem } from '../services/cart.service';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  standalone:false,
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
   breadcrumb: string[] = [];
  productId: number = 0;
  selectedVariations: { [key: string]: string } = {};
  productImages: string[] = [];
  selectedVariantPrice: number = 0;
  latestProductDetail?: ProductResponse;
  wishlist: any[] = [];
  selectedVariantImage: string | null = null;
  currentImageIndex: number = 0;
  quantity: number = 1;
  currentUser: User | null = null;

  constructor(private authService:AuthService,
    private wishlistService:WishlistService, private snackBar: MatSnackBar,
    private route: ActivatedRoute, private productService: ProductService,
     private cdr: ChangeDetectorRef,
     private cartService: CartService,
     private router: Router,
     private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      console.log('Product ID:', this.productId);
      this.fetchProductDetail();
      this.productService.getProductBreadcrumb(this.productId).subscribe(data=>{
           this.breadcrumb = data;
           this.reloadWishlist();
      });
    });
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      this.currentUser = JSON.parse(loggedInUser) as User;
    }
  }

  fetchProductDetail(): void {
    this.productService.getProductDetail(this.productId).subscribe(data => {
      this.latestProductDetail = data;
      console.log('Product Detail:', data);

      if (data && data.variants && data.variants.length > 0) {
        // Initialize with first variant
        const firstVariant = data.variants[0];
        if (firstVariant.attributes) {
          this.selectedVariations = { ...firstVariant.attributes };
        }
        this.selectedVariantPrice = firstVariant.price;
        console.log('Initial price set to:', this.selectedVariantPrice);
      }

      // Handle images
      this.productImages = [];
      if (data?.basePhotoUrl) {
        this.productImages.push(data.basePhotoUrl);
      }
      data?.variants?.forEach(variant => {
        if (variant.imageUrls && Array.isArray(variant.imageUrls)) {
          variant.imageUrls.forEach(imageUrl => {
            if (imageUrl && !this.productImages.includes(imageUrl)) {
              this.productImages.push(imageUrl);
            }
          });
        }
      });
      if (this.productImages.length === 0 && data?.imageUrl) {
        this.productImages.push(data.imageUrl);
      }

      if (this.productImages.length > 0) {
        this.selectedVariantImage = this.productImages[0];
        this.currentImageIndex = 0;
      }
      this.cdr.detectChanges();
    });
  }

  // Method to check if a variation option is available based on selected variations
  isOptionSelectable(productDetail: ProductResponse, currentVariationType: string, currentOption: string): boolean {
    console.log(`[isOptionSelectable] Checking type: ${currentVariationType}, option: ${currentOption}, selected:`, { ...this.selectedVariations });
    if (!productDetail || !productDetail.variants) {
      console.log('[isOptionSelectable] No product detail or variants.');
      return false;
    }

    const variationTypes = this.getVariationTypes(productDetail);
    const currentIndex = variationTypes.indexOf(currentVariationType);

    // Check if this variation type has the same value across all variants
    const isSameAcrossAllCurrent = this.isVariationSameAcrossAll(productDetail, currentVariationType);
    const isFirstSameAcrossAll = variationTypes.length > 0 ? this.isVariationSameAcrossAll(productDetail, variationTypes[0]) : false;

    // Handle special cases for the first two variation types if the first is same across all
    // If the current variation type is the first and same across all, or second and first is same across all,
    // all options for the current type are selectable.
    if (isSameAcrossAllCurrent || (currentIndex === 1 && isFirstSameAcrossAll)) {
      return true;
    }

    // For other cases, check if there's any variant that has this option
    // AND is compatible with the currently selected variations in *other* types
    return productDetail.variants.some(variant => {
      // Check if this variant has the current option for the current variation type
      if (variant.attributes?.[currentVariationType] !== currentOption) {
        return false;
      }

      // Check if this variant is compatible with the selected variations in *other* types
      // This means for every other variation type, if a value is selected, the variant must match it.
      for (const type in this.selectedVariations) {
        const selectedValue = this.selectedVariations[type];

        // Only check for compatibility if a value is selected for this type and it's *not* the current variation type
        if (selectedValue && type !== currentVariationType) {
          // If the variant's attribute for this selected type doesn't match the selected value, this variant is not compatible
          if (variant.attributes?.[type] !== selectedValue) {
            return false;
          }
        }
      }

      // If we reached here, the variant has the current option and is compatible with all selected variations in other types
      return true;
    });
  }

  // Helper method to check if a variation type has the same value across all variants
  private isVariationSameAcrossAll(productDetail: ProductResponse, variationType: string): boolean {
    if (!productDetail.variants || productDetail.variants.length === 0) {
      return false;
    }

    const firstValue = productDetail.variants[0].attributes?.[variationType];
    if (firstValue === undefined) return false; // Ensure the attribute exists

    return productDetail.variants.every(variant =>
      variant.attributes?.[variationType] === firstValue
    );
  }

  getVariationTypes(productDetail: ProductResponse): string[] {
    if (!productDetail || !productDetail.variants || productDetail.variants.length === 0) {
      return [];
    }
    const variationTypes = new Set<string>();
    productDetail.variants.forEach(variant => {
      if (variant.attributes) {
        Object.keys(variant.attributes).forEach(key => variationTypes.add(key));
      }
    });
    return Array.from(variationTypes);
  }

  getVariationOptions(productDetail: ProductResponse, variationType: string): string[] {
    if (!productDetail || !productDetail.variants || productDetail.variants.length === 0) {
      return [];
    }
    const options = new Set<string>();
    productDetail.variants.forEach(variant => {
      if (variant.attributes && variant.attributes[variationType]) {
        options.add(variant.attributes[variationType]);
      }
    });
    return Array.from(options);
  }

  isSelectedVariation(variationType: string, option: string): boolean {
    return this.selectedVariations[variationType] === option;
  }

  selectVariation(variationType: string, option: string): void {
    console.log(`[selectVariation] Clicked on ${variationType}: ${option}`);

    // Update the selected variation
    this.selectedVariations = { ...this.selectedVariations, [variationType]: option };
    console.log('Selected Variations:', this.selectedVariations);

    if (!this.latestProductDetail || !this.latestProductDetail.variants) {
      console.log('[selectVariation] No product data available');
      return;
    }

    // Find the matching variant
    const matchingVariant = this.latestProductDetail.variants.find(variant => {
      if (!variant.attributes) return false;

      // Check if all selected variations match this variant
      return Object.entries(this.selectedVariations).every(([type, value]) => {
        const variantValue = variant.attributes?.[type];
        const matches = variantValue === value;
        console.log(`Checking ${type}: selected=${value}, variant=${variantValue}, matches=${matches}`);
        return matches;
      });
    });

    console.log('[selectVariation] Matching variant:', matchingVariant);

    if (matchingVariant) {
      // Update price
      const oldPrice = this.selectedVariantPrice;
      this.selectedVariantPrice = matchingVariant.price;
      console.log(`[selectVariation] Price updated from ${oldPrice} to ${this.selectedVariantPrice}`);

      // Update image
      if (matchingVariant.imageUrls && matchingVariant.imageUrls.length > 0) {
        this.selectedVariantImage = matchingVariant.imageUrls[0];
      } else if (this.latestProductDetail.basePhotoUrl) {
        this.selectedVariantImage = this.latestProductDetail.basePhotoUrl;
      } else if (this.latestProductDetail.imageUrl) {
        this.selectedVariantImage = this.latestProductDetail.imageUrl;
      }
    } else {
      console.log('[selectVariation] No matching variant found');
    }
  }

  selectVariantImage(imageUrl: string): void {
    this.selectedVariantImage = imageUrl;
    const availableImages = this.getVariantImages(this.latestProductDetail!); 
    this.currentImageIndex = availableImages.indexOf(imageUrl);
  }

  previousImage(): void {
    const availableImages = this.getVariantImages(this.latestProductDetail!); 
    if (availableImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + availableImages.length) % availableImages.length;
      this.selectedVariantImage = availableImages[this.currentImageIndex];
    }
  }

  nextImage(): void {
    const availableImages = this.getVariantImages(this.latestProductDetail!); 
    if (availableImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % availableImages.length;
      this.selectedVariantImage = availableImages[this.currentImageIndex];
    }
  }

  hasVariationImage(productDetail: ProductResponse | undefined, variationType: string, option: string): boolean {
    if (!productDetail || !productDetail.variants) {
      return false;
    }
     const variant = productDetail.variants.find((v: VariantResponse) => v.attributes?.[variationType] === option);
     return variant?.attributes ? Object.keys(variant.attributes).some(key => key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) : false;
  }

  getVariationImage(productDetail: ProductResponse | undefined, variationType: string, option: string): string {
    if (!productDetail || !productDetail.variants) {
      return '';
    }
     const variant = productDetail.variants.find((v: VariantResponse) => v.attributes?.[variationType] === option);
     if (variant?.imageUrls && variant.imageUrls.length > 0) {
        return variant.imageUrls[0];
     }
     return ''; // Return empty string if no image
  }

  getVariantImages(product: ProductResponse): string[] {
    if (!product || !product.variants || Object.keys(this.selectedVariations).length === 0) {
      return this.productImages;
    }

    const matchingVariants = product.variants.filter((variant: VariantResponse) => {
      let matchesAllSelected = true;
      for (const type in this.selectedVariations) {
        if (this.selectedVariations.hasOwnProperty(type)) {
          const selectedValue = this.selectedVariations[type];
          const variantValue = variant.attributes[type];
          if (variantValue !== selectedValue) {
            matchesAllSelected = false;
            break;
          }
        }
      }
      return matchesAllSelected;
    });

    const variantImageUrls = new Set<string>();
    matchingVariants.forEach(variant => {
      if (variant.imageUrls) {
        variant.imageUrls.forEach(url => variantImageUrls.add(url));
      }
    });

    return variantImageUrls.size > 0 ? Array.from(variantImageUrls) : this.productImages;
  }

  addToWishlist(productId: number): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId === null) return;

    if (this.wishlist.some(item => item.productId === productId)) {
      this.snackBar.open('This product is already in your wishlist.', 'Close', { duration: 3000 });
      return;
    }

    this.wishlistService.addWishlistItem(userId, productId).subscribe({
      next: (res) => {
        // ✅ Show the message from backend (res.message)
        this.snackBar.open(res.message || 'Added to wishlist!', 'Close', { duration: 3000 });
        this.reloadWishlist();
      },
      error: (err) => {
        if (err.status === 409) {
          // ✅ Show conflict message from backend
          this.snackBar.open(err.error.message || 'Item already exists in wishlist.', 'Close', { duration: 3000 });
        } else {
          console.error('Failed to add to wishlist', err);
          this.snackBar.open('Failed to add to wishlist. Try again.', 'Close', { duration: 3000 });
        }
      }
    });
  }

  reloadWishlist(): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId === null) {
      console.error('User not logged in.');
      return;
    }

    this.wishlistService.getWishlistByUser(userId).subscribe({
      next: (data) => {
        this.wishlist = data;
      },
      error: (err) => {
        console.error('Failed to load wishlist', err);
      }
    });
  }

  addProductToCart(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      this.snackBar.open('Please log in to add items to cart.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.latestProductDetail || !this.latestProductDetail.variants) {
      this.snackBar.open('Product details not loaded.', 'Close', { duration: 3000 });
      return;
    }

    // Find the currently selected variant based on selectedVariations
    const selectedVariant = this.latestProductDetail.variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(this.selectedVariations).every(([type, value]) => {
        return variant.attributes?.[type] === value;
      });
    });

    if (!selectedVariant) {
      this.snackBar.open('Please select all product variations.', 'Close', { duration: 3000 });
      return;
    }

    if (selectedVariant.stock === 0 || this.quantity > selectedVariant.stock) {
      this.snackBar.open('Item is out of stock or requested quantity exceeds stock.', 'Close', { duration: 3000 });
      return;
    }

    const item: CartItem = {
      productVariantId: selectedVariant.id,
      productName: this.latestProductDetail.name,
      imageUrl: this.selectedVariantImage || this.latestProductDetail.basePhotoUrl || this.latestProductDetail.imageUrl || 'assets/img/default.jpg',
      quantity: this.quantity,
      price: selectedVariant.price,
      stock: selectedVariant.stock // Pass stock information
    };

    const added = this.cartService.addToCart(item, this.currentUser.id);
    if (added) {
      this.snackBar.open('Item added to cart!', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Could not add to cart. Not enough stock.', 'Close', { duration: 3000 });
    }
  }

  incrementQuantity(): void {
    if (this.quantity < 5) { // Max 5 items per user request
      // Also, check against available stock for the selected variant
      const matchingVariant = this.latestProductDetail?.variants?.find(variant => {
        if (!variant.attributes) return false;
        return Object.entries(this.selectedVariations).every(([type, value]) => {
          return variant.attributes?.[type] === value;
        });
      });

      if (matchingVariant && this.quantity < matchingVariant.stock) {
        this.quantity++;
      } else if (matchingVariant && this.quantity >= matchingVariant.stock) {
        this.snackBar.open('Maximum available stock reached for this item.', 'Close', { duration: 3000 });
      }
    } else {
      this.snackBar.open('You can add a maximum of 5 items per purchase.', 'Close', { duration: 3000 });
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
}




