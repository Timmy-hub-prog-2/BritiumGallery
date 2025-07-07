import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { User } from '../../user.model';
import { UserService } from '../services/user.service';
import { CouponService } from '../services/coupon.service';
import { OrderService } from '../services/order.service';

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
    private orderService: OrderService
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
    return this.getSubtotal();
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
