import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductResponse, VariantResponse } from '../ProductResponse';
import { ProductService } from '../product.service';
import { Observable, tap, combineLatest, map, BehaviorSubject } from 'rxjs';
import { AuthService } from '../AuthService';
import { HttpClient } from '@angular/common/http';
import { WishlistService } from '../wishlist.service';
import { CartService } from '../card.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CartPreviewComponent } from '../cart-preview/cart-preview.component';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  standalone: false,
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  breadcrumb: string[] = [];
  productId: number = 0;
  productDetail$!: Observable<ProductResponse>;
  selectedVariations: { [key: string]: string } = {};
  productImages: string[] = [];
  mainImageUrl: string | undefined;
  selectedVariantPrice: number = 0;
  selectedVariantId: number | null = null;
  latestProductDetail?: ProductResponse;
  wishlist: any[] = [];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService:AuthService,private http: HttpClient,
    private wishlistService:WishlistService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      this.fetchProductDetail();
      this.productService.getProductBreadcrumb(this.productId).subscribe(data=>{
           this.breadcrumb = data;
           this.reloadWishlist(); 
      })
      this.productService.getProductBreadcrumb(this.productId).subscribe(data => {
        this.breadcrumb = data;
      });
    });
  }

  fetchProductDetail(): void {
    this.productDetail$ = this.productService.getProductDetail(this.productId).pipe(
      tap(data => {
        this.latestProductDetail = data;

        if (data.variants && data.variants.length > 0) {
          const firstVariant = data.variants[0];
          if (firstVariant.attributes) {
            this.selectedVariations = { ...firstVariant.attributes };
          }
          this.selectedVariantPrice = firstVariant.price;
          this.selectedVariantId = firstVariant.id;
        }

        this.productImages = [];

        if (data.basePhotoUrl) this.productImages.push(data.basePhotoUrl);

        data.variants?.forEach(variant => {
          if (Array.isArray(variant.imageUrls)) {
            variant.imageUrls.forEach(imageUrl => {
              if (imageUrl && !this.productImages.includes(imageUrl)) {
                this.productImages.push(imageUrl);
              }
            });
          } else if (typeof variant.imageUrls === 'string') {
            if (!this.productImages.includes(variant.imageUrls)) {
              this.productImages.push(variant.imageUrls);
            }
          }
        });

        if (this.productImages.length === 0 && data.imageUrl) {
          this.productImages.push(data.imageUrl);
        }

        if (this.productImages.length > 0) {
          this.mainImageUrl = this.productImages[0];
        }
      })
    );
  }

  isOptionSelectable(productDetail: ProductResponse, currentVariationType: string, currentOption: string): boolean {
    const variationTypes = this.getVariationTypes(productDetail);
    const currentIndex = variationTypes.indexOf(currentVariationType);
    const isSameAcrossAll = this.isVariationSameAcrossAll(productDetail, currentVariationType);
    const isFirstSame = variationTypes.length > 0 && this.isVariationSameAcrossAll(productDetail, variationTypes[0]);

    if (isSameAcrossAll || (currentIndex === 1 && isFirstSame)) return true;

    return productDetail.variants.some(variant => {
      if (variant.attributes?.[currentVariationType] !== currentOption) return false;
      return Object.entries(this.selectedVariations).every(([type, value]) =>
        type === currentVariationType || variant.attributes?.[type] === value
      );
    });
  }

  private isVariationSameAcrossAll(productDetail: ProductResponse, variationType: string): boolean {
    const firstValue = productDetail.variants[0].attributes?.[variationType];
    return productDetail.variants.every(v => v.attributes?.[variationType] === firstValue);
  }

  getVariationTypes(productDetail: ProductResponse): string[] {
    const variationTypes = new Set<string>();
    productDetail.variants.forEach(v => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach(type => variationTypes.add(type));
      }
    });
    return Array.from(variationTypes);
  }

  getVariationOptions(productDetail: ProductResponse, variationType: string): string[] {
    const options = new Set<string>();
    productDetail.variants.forEach(v => {
      if (v.attributes?.[variationType]) {
        options.add(v.attributes[variationType]);
      }
    });
    return Array.from(options);
  }

  isSelectedVariation(variationType: string, option: string): boolean {
    return this.selectedVariations[variationType] === option;
  }

  selectVariation(variationType: string, option: string): void {
    this.selectedVariations = { ...this.selectedVariations, [variationType]: option };

    const matchingVariant = this.latestProductDetail?.variants.find(v =>
      Object.entries(this.selectedVariations).every(([type, value]) =>
        v.attributes?.[type] === value
      )
    );

    if (matchingVariant) {
      this.selectedVariantPrice = matchingVariant.price;
      this.selectedVariantId = matchingVariant.id;

      if (Array.isArray(matchingVariant.imageUrls) && matchingVariant.imageUrls.length > 0) {
        this.mainImageUrl = matchingVariant.imageUrls[0];
      } else if (typeof matchingVariant.imageUrls === 'string') {
        this.mainImageUrl = matchingVariant.imageUrls;
      } else {
        this.mainImageUrl = this.latestProductDetail?.basePhotoUrl || this.latestProductDetail?.imageUrl;
      }
    } else {
      this.selectedVariantId = null;
    }
  }

  selectImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;
  }

  hasVariationImage(productDetail: ProductResponse | undefined, variationType: string, option: string): boolean {
    const variant = productDetail?.variants.find(v => v.attributes?.[variationType] === option);
    return !!variant?.attributes && Object.keys(variant.attributes).some(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('photo'));
  }

  getVariationImage(productDetail: ProductResponse | undefined, variationType: string, option: string): string {
    const variant = productDetail?.variants.find(v => v.attributes?.[variationType] === option);
    if (variant?.attributes) {
      for (const key in variant.attributes) {
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) {
          return variant.attributes[key];
        }
      }
    }
    return '';
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

  addToCart(variantId: number | null): void {
    if (!variantId || !this.latestProductDetail) {
      alert("❌ Please select a valid product variant.");
      return;
    }
  
    const variant = this.latestProductDetail.variants.find(v => v.id === variantId);
    if (!variant) {
      alert("❌ Product variant not found.");
      return;
    }
  
    const currentCart = this.cartService.getCartItems();
    const existingItem = currentCart.find(item => item.productVariantId === variantId);
    const currentQuantity = existingItem?.quantity || 0;
  
    if (currentQuantity >= variant.stock) {
      alert("⚠️ No more product left in stock.");
      return;
    }
  
    this.cartService.addToCart({
      productVariantId: variantId,
      productName: this.latestProductDetail.name,
      imageUrl: this.mainImageUrl || '',
      quantity: 1,
      price: variant.price,
      stock: variant.stock
    });
  
    this.snackBar.open('🛒 Item added to cart!', '', {
      duration: 2000,
      verticalPosition: 'top'
    });
    
  }
  
}
