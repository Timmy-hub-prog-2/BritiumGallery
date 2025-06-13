import { Component } from '@angular/core';
import { CartItem, CartService } from '../card.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-preview',
  standalone: false,
  templateUrl: './cart-preview.component.html',
  styleUrls: ['./cart-preview.component.css']
})
export class CartPreviewComponent {
  items: CartItem[] = [];

  constructor(private cartService: CartService, private router: Router) {
    this.items = this.cartService.getCartItems();
  }

  increment(item: CartItem): void {
    if (item.quantity < item.stock) {
      item.quantity++;
      this.cartService.updateCartItem(item);
      this.items = this.cartService.getCartItems();
    } else {
      alert('No more product left in stock.');
    }
  }

  decrement(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCartItem(item);
      this.items = this.cartService.getCartItems();
    }
  }

  remove(variantId: number): void {
    this.cartService.removeFromCart(variantId);
    this.items = this.cartService.getCartItems();
  }

  getTotalCost(): number {
    return this.items.reduce((total, item) => total + item.quantity * item.price, 0);
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  continueShopping(): void {
    this.router.navigate(['/']);
  }

  clearCart() {
    localStorage.removeItem('cart');  
    this.items = [];                
  }
} 
