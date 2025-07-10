import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  productId: number;
  productVariantId: number;
  productName: string;
  imageUrl: string;
  quantity: number;
  price: number;
  stock: number;
  discountedPrice?: number | null;
  discountPercent?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  private discountAmount: number = 0;
  private appliedCouponCode: string = '';
  private discountType: string = '';
  private discountValue: string = '';

  setDiscount(amount: number): void {
    this.discountAmount = amount;
  }

  getDiscount(): number {
    return this.discountAmount;
  }

  setAppliedCouponCode(code: string): void {
    this.appliedCouponCode = code;
  }

  getAppliedCouponCode(): string {
    return this.appliedCouponCode;
  }

  setDiscountType(type: string): void {
    this.discountType = type;
  }

  getDiscountType(): string {
    return this.discountType;
  }

  setDiscountValue(value: string): void {
    this.discountValue = value;
  }

  getDiscountValue(): string {
    return this.discountValue;
  }

  private getCartKey(userId: number): string {
    return `cartItems_${userId}`;
  }

  constructor() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      this.updateCartCount(user.id);  
    }
  }
  
  getCartItems(userId: number): CartItem[] {
    const cart = localStorage.getItem(this.getCartKey(userId));
    return cart ? JSON.parse(cart) : [];
  }

  private updateCartCount(userId: number): void {
    const items = this.getCartItems(userId);
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCountSubject.next(total);
  }

  addToCart(item: CartItem, userId: number): boolean {
    const items = this.getCartItems(userId);
    const existingItem = items.find(i => i.productVariantId === item.productVariantId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      if (newQuantity > existingItem.stock) return false;
      existingItem.quantity = newQuantity;
    } else {
      if (item.quantity > item.stock) return false;
      items.push(item);
    }

    localStorage.setItem(this.getCartKey(userId), JSON.stringify(items));
    this.updateCartCount(userId);
    return true;
  }

  removeFromCart(variantId: number, userId: number): void {
    const items = this.getCartItems(userId).filter(item => item.productVariantId !== variantId);
    localStorage.setItem(this.getCartKey(userId), JSON.stringify(items));
    this.updateCartCount(userId);
  }

  clearCart(userId: number): void {
    localStorage.removeItem(this.getCartKey(userId));
    this.updateCartCount(userId);
  }

  updateCartItem(item: CartItem, userId: number): void {
    const items = this.getCartItems(userId);
    const index = items.findIndex(i => i.productVariantId === item.productVariantId);
    if (index !== -1) {
      items[index] = item;
      localStorage.setItem(this.getCartKey(userId), JSON.stringify(items));
      this.updateCartCount(userId);
    }
  }

  getTotalQuantity(userId: number): number {
    const items = this.getCartItems(userId);
    return items.reduce((total, item) => total + item.quantity, 0);
  }
}
