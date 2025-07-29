import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../wishlist.service';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../ProductResponse';

interface WishlistItem {
  productId: number;
  productName: string;
  productPhotoUrl: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  wishlist: WishlistItem[] = [];
  productDetails: { [productId: number]: ProductResponse } = {};

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.reloadWishlist();
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product-detail', productId]);
  }

  goToBrowse(): void {
    this.router.navigate(['/browse']);
  }

  clearWishlist(): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId === null) {
      console.error('User not logged in.');
      return;
    }

    // Clear all items from wishlist
    this.wishlist.forEach(item => {
      this.wishlistService.removeWishlistItem(userId, item.productId).subscribe({
        next: (res: any) => {
          if (res && res.success !== false) {
            console.log(`Removed item ${item.productId} from wishlist`);
          } else {
            console.error(`Failed to remove item ${item.productId}:`, res.message);
          }
        },
        error: (err) => {
          console.error(`Failed to remove item ${item.productId}:`, err);
        }
      });
    });

    // Clear local arrays
    this.wishlist = [];
    this.productDetails = {};
  }

  reloadWishlist(): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId === null) {
      console.error('User not logged in.');
      return;
    }

    this.wishlistService.getWishlistByUser(userId).subscribe({
      next: (data: WishlistItem[]) => {
        this.wishlist = data;
        this.productDetails = {};
        for (const item of data) {
          this.productService.getProductDetail(item.productId).subscribe({
            next: (product: ProductResponse) => {
              this.productDetails[item.productId] = product;
            },
            error: (err) => {
              console.error(`Failed to load product details for ${item.productId}:`, err);
            }
          });
        }
        console.log('Wishlist loaded:', data);
      },
      error: (err) => {
        console.error('Error loading wishlist for user ID', userId, err);
      }
    });
  }

  addToCart(item: WishlistItem): void {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', item);
  }

  getColorCount(detail: ProductResponse): number {
    if (!detail || !detail.variants) return 0;
    const colorSet = new Set<string>();
    for (const variant of detail.variants) {
      if (variant.attributes && variant.attributes['Color']) {
        colorSet.add(variant.attributes['Color']);
      }
    }
    return colorSet.size;
  }

  getAttributeCounts(detail: ProductResponse): { [attr: string]: number } {
    if (!detail || !detail.variants) return {};
    const attrMap: { [attr: string]: Set<string> } = {};
    for (const variant of detail.variants) {
      if (variant.attributes) {
        for (const key of Object.keys(variant.attributes)) {
          if (!attrMap[key]) attrMap[key] = new Set();
          attrMap[key].add(variant.attributes[key]);
        }
      }
    }
    const result: { [attr: string]: number } = {};
    for (const key of Object.keys(attrMap)) {
      result[key] = attrMap[key].size;
    }
    return result;
  }

  getPriceRange(detail: ProductResponse): string {
    if (!detail || !detail.variants || detail.variants.length === 0) return '-';
    const prices = detail.variants.map(v => v.price).filter(p => typeof p === 'number');
    if (prices.length === 0) return '-';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min} MMK` : `${min} MMK - ${max} MMK`;
  }

  removeFromWishlist(productId: number): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId === null) {
      console.error('User not logged in.');
      return;
    }

    this.wishlistService.removeWishlistItem(userId, productId).subscribe({
      next: (res: any) => {
        if (res && res.success !== false) {
          this.wishlist = this.wishlist.filter(item => item.productId !== productId);
          delete this.productDetails[productId];
        } else {
          console.error(res.message || 'Failed to remove from wishlist.');
        }
      },
      error: (err) => {
        console.error('Failed to remove from wishlist:', err);
      }
    });
  }
}
