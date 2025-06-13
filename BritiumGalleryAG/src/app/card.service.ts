import { Injectable } from '@angular/core';
export interface CartItem {
    productVariantId: number;
    productName: string;
    imageUrl: string;
    quantity: number;
    price: number;
    stock: number;
  }
  

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'cartItems';

  constructor() {}

  getCartItems(): CartItem[] {
    const cart = localStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : [];
  }

  addToCart(item: CartItem): void {
    const items = this.getCartItems();
    const existingItem = items.find(i => i.productVariantId === item.productVariantId);
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      items.push(item);
    }

    localStorage.setItem(this.cartKey, JSON.stringify(items));
  }

  removeFromCart(variantId: number): void {
    const items = this.getCartItems().filter(item => item.productVariantId !== variantId);
    localStorage.setItem(this.cartKey, JSON.stringify(items));
  }

  clearCart(): void {
    localStorage.removeItem(this.cartKey);
  }

  updateCartItem(item: CartItem): void {
    const items = this.getCartItems();
    const index = items.findIndex(i => i.productVariantId === item.productVariantId);
    if (index !== -1) {
      items[index] = item;
      localStorage.setItem(this.cartKey, JSON.stringify(items));
    }
  }
  
}
