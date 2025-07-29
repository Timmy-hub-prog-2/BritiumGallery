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
import Swal from 'sweetalert2';
import { NotificationService } from '../services/notification.service';
import { ProductRecommendation } from '../services/product.service';
import { CategoryService } from '../category.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  standalone:false,
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
   breadcrumb: Array<{ name: string, id?: number }> = [];
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
  recommendations: ProductRecommendation[] = [];

  constructor(
    private authService:AuthService,
    private wishlistService:WishlistService, private snackBar: MatSnackBar,
    private route: ActivatedRoute, private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService, // <-- Injected
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      console.log('Product ID:', this.productId);
      this.fetchProductDetail();
      this.loadWishlist();
      this.fetchRecommendations(); // Ensure recommendations are always loaded
    });
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      this.currentUser = JSON.parse(loggedInUser) as User;
    }
  }

  // New method to update state based on current selectedVariations
  private updateSelectedVariantState(): void {
    if (!this.latestProductDetail || !this.latestProductDetail.variants) return;
    const matchingVariant = this.latestProductDetail.variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(this.selectedVariations).every(([type, value]) => variant.attributes[type] === value);
    });
    if (matchingVariant) {
      this.selectedVariantPrice = matchingVariant.discountedPrice ?? matchingVariant.price;
      if (matchingVariant.imageUrls && matchingVariant.imageUrls.length > 0) {
        this.selectedVariantImage = matchingVariant.imageUrls[0];
        this.currentImageIndex = 0;
      } else if (this.latestProductDetail.basePhotoUrl) {
        this.selectedVariantImage = this.latestProductDetail.basePhotoUrl;
        this.currentImageIndex = 0;
      } else if (this.latestProductDetail.imageUrl) {
        this.selectedVariantImage = this.latestProductDetail.imageUrl;
        this.currentImageIndex = 0;
      }
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
          this.updateSelectedVariantState();
        }
        // Use discounted price if present
        // (handled in updateSelectedVariantState)
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

      if (this.productImages.length > 0 && !this.selectedVariantImage) {
        this.selectedVariantImage = this.productImages[0];
        this.currentImageIndex = 0;
      }

      // Build breadcrumb with category path and product name
      if (data && data.categoryId) {
        this.categoryService.getCategoryPath(data.categoryId).subscribe({
          next: (path: any[]) => {
            console.log('Category path for breadcrumb:', path);
            this.breadcrumb = path.map(cat => ({ name: cat.name, id: cat.id }));
            this.breadcrumb.push({ name: data.name });
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to fetch category path for breadcrumb', err);
            this.breadcrumb = [{ name: data.name }];
            this.cdr.detectChanges();
          }
        });
      } else {
        this.breadcrumb = [{ name: data.name }];
        this.cdr.detectChanges();
      }
    });
  }

  fetchRecommendations(): void {
    this.productService.getRecommendedProducts(this.productId, 8).subscribe(data => {
      this.recommendations = data;
      console.log('Recommendations:', this.recommendations);
      this.cdr.detectChanges();
    });
  }

  // Method to check if a variation option is available based on selected variations
  isOptionSelectable(productDetail: ProductResponse, currentVariationType: string, currentOption: string): boolean {
    if (!productDetail || !productDetail.variants) {
      return false;
    }

    const variationTypes = this.getVariationTypes(productDetail);
    const currentIndex = variationTypes.indexOf(currentVariationType);

    // For the first variation type, always return true (always clickable)
    if (currentIndex === 0) {
      return true;
    }

    // For other types, use the existing logic
    // Check if this variation type has the same value across all variants
    const isSameAcrossAllCurrent = this.isVariationSameAcrossAll(productDetail, currentVariationType);
    const isFirstSameAcrossAll = variationTypes.length > 0 ? this.isVariationSameAcrossAll(productDetail, variationTypes[0]) : false;

    // Handle special cases for the first two variation types if the first is same across all
    if (isSameAcrossAllCurrent || (currentIndex === 1 && isFirstSameAcrossAll)) {
      return true;
    }

    // For other cases, check if there's any variant that has this option
    // AND is compatible with the currently selected variations in *other* types
    return productDetail.variants.some(variant => {
      if (variant.attributes?.[currentVariationType] !== currentOption) {
        return false;
      }
      for (const type in this.selectedVariations) {
        const selectedValue = this.selectedVariations[type];
        if (selectedValue && type !== currentVariationType) {
          if (variant.attributes?.[type] !== selectedValue) {
            return false;
          }
        }
      }
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

    if (!this.latestProductDetail || !this.latestProductDetail.variants) return;

    // Try to find a matching variant for the current selection
    let matchingVariant = this.latestProductDetail.variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(this.selectedVariations).every(([type, value]) => variant.attributes[type] === value);
    });

    // If not found, auto-switch to the first available variant that matches the newly selected value for the changed type
    if (!matchingVariant) {
      matchingVariant = this.latestProductDetail.variants.find(variant => {
        if (!variant.attributes) return false;
        // Must match the newly selected value for the changed type
        if (variant.attributes[variationType] !== option) return false;
        // No need to match other types
        return true;
      });
      if (matchingVariant && matchingVariant.attributes) {
        this.selectedVariations = { ...matchingVariant.attributes };
      }
    }

    this.updateSelectedVariantState();
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

    // Find the matching variant for the current selection
    const matchingVariant = product.variants.find((variant: VariantResponse) => {
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

    if (matchingVariant && matchingVariant.imageUrls && matchingVariant.imageUrls.length > 0) {
      return matchingVariant.imageUrls;
    }

    // Fallback: return all product images
    return this.productImages;
  }

 addToWishlist(productId: number): void {
   if (!this.currentUser) {
      this.router.navigate(['/login']);
      Swal.fire({
        icon: 'info',
        title: 'Login Required',
        text: 'Please log in to add items to wishlist.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
      return;
    }
  const userId = this.authService.getLoggedInUserId();
  if (userId === null) return;

  if (this.isProductInWishlist(productId)) {
          Swal.fire({
        icon: 'info',
        title: 'Already in Wishlist',
        text: 'This product is already in your wishlist.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
    return;
  }

  this.wishlistService.addWishlistItem(userId, productId).subscribe({
    next: (res) => {
      // ✅ Update local wishlist state immediately
      this.wishlist.push({ productId });
      Swal.fire({
        icon: 'success',
        title: 'Added to Wishlist!',
        text: res.message || 'Product has been added to your wishlist.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
    },
    error: (err) => {
      if (err.status === 409) {
        Swal.fire({
          icon: 'warning',
          title: 'Already in Wishlist',
          text: err.error.message || 'Item already exists in wishlist.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#000000'
        });
      } else {
        console.error('Failed to add to wishlist', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Add',
          text: 'Failed to add to wishlist. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#000000'
        });
      }
    }
  });
}

removeFromWishlist(productId: number): void {
  console.log("i am here ");
  

  const userId = this.authService.getLoggedInUserId();
  if (userId === null) return;

  this.wishlistService.removeWishlistItem(userId, productId).subscribe({
    next: (res: any) => {
      if (res && res.success !== false) {
        Swal.fire({
          icon: 'success',
          title: 'Removed from Wishlist',
          text: 'Product has been removed from your wishlist.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#000000'
        });

        // ✅ Update local wishlist state immediately
        this.wishlist = this.wishlist.filter(item => item.productId !== productId);

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Remove',
          text: res.message || 'Could not remove from wishlist.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#000000'
        });
      }
    },
    error: (err) => {
      console.error('Failed to remove from wishlist', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Remove',
        text: 'Failed to remove from wishlist. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
    }
  });
}

// Check if product is in wishlist
isProductInWishlist(productId: number): boolean {
  return this.wishlist.some(item => item.productId === productId);
}

 
loadWishlist(): void {
  const userId = this.authService.getLoggedInUserId();
  if (userId === null) return;

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
      Swal.fire({
        icon: 'info',
        title: 'Login Required',
        text: 'Please log in to add items to cart.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
      return;
    }

    if (!this.latestProductDetail || !this.latestProductDetail.variants) {
      Swal.fire({
        icon: 'error',
        title: 'Product Not Loaded',
        text: 'Product details not loaded. Please refresh the page.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
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
      Swal.fire({
        icon: 'warning',
        title: 'Select Variations',
        text: 'Please select all product variations before adding to cart.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
      return;
    }

    if (selectedVariant.stock === 0 || this.quantity > selectedVariant.stock) {
      Swal.fire({
        icon: 'warning',
        title: 'Out of Stock',
        text: 'This item is out of stock. Would you like to be notified when it is restocked?',
        showCancelButton: true,
        confirmButtonText: 'Remind Me',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#000000',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.notificationService.registerRestockNotification(this.currentUser!.id, selectedVariant.id).subscribe({
            next: (res) => {
              console.log('Restock notification success:', res);
              Swal.fire({
                icon: 'success',
                title: 'Registered!',
                text: 'You will be notified when this product is restocked.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#000000'
              });
            },
            error: (err) => {
              console.log('Restock notification error:', err);
              let msg = 'Failed to register for restock notification.';
              if (err && err.status === 400 && err.error && typeof err.error.message === 'string') {
                if (err.error.message.includes('already registered')) {
                  msg = 'You have already added this product to your reminder list.';
                } else {
                  msg = err.error.message;
                }
              }
              Swal.fire({
                icon: 'info',
                title: 'Notice',
                text: msg,
                confirmButtonText: 'OK',
                confirmButtonColor: '#000000'
              });
            }
          });
        }
      });
      return;
    }

    const item: CartItem = {
      productId: this.latestProductDetail.id,  
      productVariantId: selectedVariant.id,
      productName: this.latestProductDetail.name,
      imageUrl: this.selectedVariantImage || this.latestProductDetail.basePhotoUrl || this.latestProductDetail.imageUrl || 'assets/img/default.jpg',
      quantity: this.quantity,
      price: selectedVariant.price,
      stock: selectedVariant.stock // Pass stock information
    };

    const added = this.cartService.addToCart(item, this.currentUser.id);
    if (added) {
      Swal.fire({
        icon: 'success',
        title: 'Added to Cart!',
        text: 'Item has been successfully added to your cart.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Add to Cart',
        text: 'Could not add to cart. Not enough stock available.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
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
        Swal.fire({
          icon: 'warning',
          title: 'Stock Limit Reached',
          text: 'Maximum available stock reached for this item.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#000000'
        });
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Quantity Limit',
        text: 'You can add a maximum of 5 items per purchase.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#000000'
      });
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // Returns the currently selected variant based on selectedVariations
  getSelectedVariant(): VariantResponse | undefined {
    if (!this.latestProductDetail || !this.latestProductDetail.variants) return undefined;
    return this.latestProductDetail.variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(this.selectedVariations).every(([type, value]) => variant.attributes[type] === value);
    }) || this.latestProductDetail.variants[0];
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product-detail', productId]);
  }
}




