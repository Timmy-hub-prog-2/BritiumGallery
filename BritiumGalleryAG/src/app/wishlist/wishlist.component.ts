import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../wishlist.service';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../ProductResponse';

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  wishlist: any[] = [];
  productDetails: { [productId: number]: ProductResponse } = {};

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router:Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.reloadWishlist();
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product-detail', productId]);
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
        this.productDetails = {};
        for (const item of data) {
          this.productService.getProductDetail(item.productId).subscribe(product => {
            this.productDetails[item.productId] = product;
          });
        }
        console.log('Wishlist loaded:', data);
      },
      error: (err) => {
        console.error('Error loading wishlist for user ID', userId, err);
      }
    });
  }

  addToCart(item: any) {
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
}
