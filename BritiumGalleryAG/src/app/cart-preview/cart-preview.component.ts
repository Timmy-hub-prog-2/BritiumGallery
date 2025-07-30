import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { User } from '../../user.model';
import { UserService } from '../services/user.service';
import { CouponService } from '../services/coupon.service';
import { OrderService } from '../services/order.service';
import { ProductService } from '../services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart-preview',
  standalone: false,
  templateUrl: './cart-preview.component.html',
  styleUrls: ['./cart-preview.component.css']
})
export class CartPreviewComponent implements OnInit {
  items: CartItem[] = [];
  currentUser: User | null = null;

  constructor(
    private cartService: CartService,
    private router: Router,
    private userService: UserService,
    private couponService: CouponService,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCartItems();
  }

  private loadCurrentUser(): void {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      this.currentUser = JSON.parse(loggedInUser) as User;
    }
  }

  private loadCartItems(): void {
    if (this.currentUser) {
      const rawItems = this.cartService.getCartItems(this.currentUser.id);
      // Fetch latest discount info for each item
      const updatedItems: CartItem[] = [];
      rawItems.forEach(item => {
        this.productService.getProductDetail(item.productId).subscribe(product => {
          const variant = product.variants.find((v: any) => v.id === item.productVariantId);
          if (variant) {
            updatedItems.push({
              ...item,
              discountedPrice: variant.discountedPrice ?? null,
              discountPercent: variant.discountPercent ?? null
            });
          } else {
            updatedItems.push(item);
          }
          // Only update items array when all items are processed
          if (updatedItems.length === rawItems.length) {
            this.items = updatedItems;
          }
        });
      });
    } else {
      this.items = [];
    }
  }

  increment(item: CartItem): void {
    if (this.currentUser && item.quantity < item.stock) {
      item.quantity++;
      this.cartService.updateCartItem(item, this.currentUser.id);
      this.loadCartItems();
    } else if (!this.currentUser) {
      this.router.navigate(['/login']);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Stock Limit Reached',
        text: 'No more product left in stock.',
        confirmButtonColor: '#000000',
        confirmButtonText: 'OK'
      });
    }
  }

  decrement(item: CartItem): void {
    if (this.currentUser && item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCartItem(item, this.currentUser.id);
      this.loadCartItems();
    } else if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  remove(variantId: number): void {
    if (this.currentUser) {
      this.cartService.removeFromCart(variantId, this.currentUser.id);
      this.loadCartItems();
    } else {
      this.router.navigate(['/login']);
    }
  }

  getSubtotal(): number {
    return this.items.reduce((total, item) => {
      const price = (item as any).discountedPrice && (item as any).discountedPrice < item.price 
        ? (item as any).discountedPrice 
        : item.price;
      return total + item.quantity * price;
    }, 0);
  }

  getTotalCost(): number {
    return this.getSubtotal();
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  continueShopping(): void {
    this.router.navigate(['/customer-homepage']);
  }

  clearCart() {
    if (this.currentUser) {
      this.cartService.clearCart(this.currentUser.id);
      this.items = [];
    } else {
      this.router.navigate(['/login']);
    }
  }

  proceedToCheckout(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Simply navigate to checkout page - don't create order or clear cart yet
    this.router.navigate(['/checkout']);
  }
}
