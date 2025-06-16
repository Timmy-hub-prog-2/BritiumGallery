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
  private getCartKey(userId: number): string {
    return `cartItems_${userId}`;
  }

  constructor() {}

  getCartItems(userId: number): CartItem[] {
    const cart = localStorage.getItem(this.getCartKey(userId));
    return cart ? JSON.parse(cart) : [];
  }

  addToCart(item: CartItem, userId: number): boolean {
    const items = this.getCartItems(userId);
    const existingItem = items.find(i => i.productVariantId === item.productVariantId);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      if (newQuantity > existingItem.stock) {
        return false; // Not enough stock
      }
      existingItem.quantity = newQuantity;
    } else {
      if (item.quantity > item.stock) {
        return false; // Not enough stock for the initial add
      }
      items.push(item);
    }

    localStorage.setItem(this.getCartKey(userId), JSON.stringify(items));
    return true;
  }

  removeFromCart(variantId: number, userId: number): void {
    const items = this.getCartItems(userId).filter(item => item.productVariantId !== variantId);
    localStorage.setItem(this.getCartKey(userId), JSON.stringify(items));
  }

  clearCart(userId: number): void {
    localStorage.removeItem(this.getCartKey(userId));
  }

  updateCartItem(item: CartItem, userId: number): void {
    const items = this.getCartItems(userId);
    const index = items.findIndex(i => i.productVariantId === item.productVariantId);
    if (index !== -1) {
      items[index] = item;
      localStorage.setItem(this.getCartKey(userId), JSON.stringify(items));
    }
  }
  
}