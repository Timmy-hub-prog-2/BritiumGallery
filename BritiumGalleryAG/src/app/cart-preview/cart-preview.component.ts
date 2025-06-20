import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { User } from '../../user.model';
import { UserService } from '../services/user.service';
import { CouponService } from '../services/coupon.service';

@Component({
  selector: 'app-cart-preview',
  standalone: false,
  templateUrl: './cart-preview.component.html',
  styleUrls: ['./cart-preview.component.css']
})
export class CartPreviewComponent implements OnInit {
  items: CartItem[] = [];
  currentUser: User | null = null;

  couponCode: string = '';
  discountAmount: number = 0;
  couponError: string = '';
  couponApplied: boolean = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private userService: UserService,
    private couponService: CouponService
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
      this.items = this.cartService.getCartItems(this.currentUser.id);
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
      alert('No more product left in stock.');
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
    return this.items.reduce((total, item) => total + item.quantity * item.price, 0);
  }

  getTotalCost(): number {
    return this.getSubtotal() - this.discountAmount;
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  clearCart() {
    if (this.currentUser) {
      this.cartService.clearCart(this.currentUser.id);
      this.items = [];
      this.resetCoupon(); // ✅ clear coupon on cart clear
    } else {
      this.router.navigate(['/login']);
    }
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  applyCoupon(): void {
    if (!this.couponCode) {
      this.couponError = 'Please enter a coupon code.';
      return;
    }

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.couponService.applyCoupon(this.couponCode, this.currentUser.id, this.getSubtotal()).subscribe({
      next: (discount: number) => {
        this.discountAmount = discount;
        this.couponError = '';
      },
      error: (err) => {
        this.couponError = err.error || 'Failed to apply coupon.';
        this.discountAmount = 0;
      }
    });
    
  }

  private resetCoupon(): void {
    this.couponCode = '';
    this.discountAmount = 0;
    this.couponError = '';
    this.couponApplied = false;
  }
}
