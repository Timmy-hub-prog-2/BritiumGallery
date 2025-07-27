import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { UserService } from '../services/user.service';
import { People } from '../People';
import { AddressService } from '../address.service';
import { AddressDTO } from '../../AddressDTO';
import { DeliveryService } from '../delivery.service';
import { Delivery, DeliveryFeeRequestDTO } from '../Delivery';
import { CouponService } from '../services/coupon.service';
import { OrderService } from '../services/order.service';
import { ProductService } from '../services/product.service';
import { distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  showOrderItemsModal = false;
  checkoutForm!: FormGroup;
  items: CartItem[] = [];
  currentUser: People | null = null;
  promoCode: string = '';
  appliedDiscount = 0;
  deliveryFee: number = 0;
  couponSuccess: boolean = false;
  couponError: string = '';

  discountType: string = '';
  discountValue: string = '';

  mainAddress: string = 'Loading...';
  mainAddressDTO!: AddressDTO;
  addresses: AddressDTO[] = [];
  mainAddressId!: number;
  showAllAddresses = false;

  // New delivery structure with speed types
  standardOptions: Delivery[] = [];
  expressOptions: Delivery[] = [];
  shipOptions: Delivery[] = [];

  selectedDelayTime: string | null = null;
  selectedDelayRange: string | null = null;
  calculatedDistance: number = 0;

  suggestedMethod: string = 'standard';
  isAddressModalOpen = false;
  methodAutoChanged = false;
  showCouponAppliedPopup = false;

  private isCalculatingDeliveryFee = false;

  // Store detailed variant information
  variantDetails: { [key: number]: any } = {};

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private userService: UserService,
    private router: Router,
    private addressService: AddressService,
    private deliveryService: DeliveryService,
    private couponService: CouponService,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
    this.loadCartItems();
    this.loadDeliveryOptions();
    this.appliedDiscount = this.cartService.getDiscount();
    this.promoCode = this.cartService.getAppliedCouponCode();
    this.discountType = this.cartService.getDiscountType();
    this.discountValue = this.cartService.getDiscountValue();

    if (localStorage.getItem('couponApplied') === 'true') {
      this.showCouponAppliedPopup = true;
      localStorage.removeItem('couponApplied');
      setTimeout(() => this.showCouponAppliedPopup = false, 3000);
    }

    // Recalculate delivery fee when shipping method changes
    this.checkoutForm.get('deliveryType')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        this.calculateDeliveryFee();
      });

    // Recalculate delivery fee when speed type changes
    this.checkoutForm.get('speedType')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
          this.calculateDeliveryFee();
      });

    // Final calculation after all data is loaded
    setTimeout(() => {
          this.calculateDeliveryFee();
    }, 1000);
  }

  private initForm(): void {
    this.checkoutForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      houseNumber: [''],
      wardName: [''],
      street: [''],
      township: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      billingSameAsShipping: [true],
      deliveryType: ['standard', Validators.required],
      speedType: ['normal', Validators.required]
    });
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('loggedInUser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr) as People;
      this.checkoutForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phoneNumber
      });
      this.loadMainAddress(this.currentUser.id);
      this.loadCartItems();
    }
  }

  loadMainAddress(userId: number): void {
    this.addressService.getMainAddressByUserId(userId).subscribe({
      next: (address) => {
        this.mainAddressDTO = address;
        this.mainAddressId = address.id!;
        this.mainAddress = this.formatAddress(address);
        // Calculate delivery fee after address is loaded
        setTimeout(() => {
        this.calculateDeliveryFee();
        }, 0);
      },
      error: err => console.error('❌ Error loading main address:', err)
    });

    this.addressService.getAddressesByUserId(userId).subscribe({
      next: (list) => (this.addresses = list),
      error: err => console.error('❌ Error loading addresses:', err)
    });
  }

  toggleAddressList(): void {
    this.showAllAddresses = !this.showAllAddresses;
  }

  openAddressModal(): void {
    this.isAddressModalOpen = true;
  }
  
  closeAddressModal(): void {
    this.isAddressModalOpen = false;
  }

  setAsMain(addressId: number): void {
    if (!this.currentUser) return;
    this.addressService.setMainAddress(this.currentUser.id, addressId).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Main address updated',
          showConfirmButton: false,
          timer: 1500
        });
        this.loadMainAddress(this.currentUser!.id);
        this.checkoutForm.patchValue({ deliveryType: 'standard' });
        this.calculateDeliveryFee();
        this.closeAddressModal();
      },
      error: err => Swal.fire({
        icon: 'error',
        title: 'Failed to update main address',
        text: 'Please try again.'
      })
    });
  }

  loadDeliveryOptions(): void {
    // Load all delivery options in parallel
    const standardPromise = this.deliveryService.getDeliveriesByType('standard').toPromise();
    const expressPromise = this.deliveryService.getDeliveriesByType('express').toPromise();
    const shipPromise = this.deliveryService.getDeliveriesByType('ship').toPromise();

    Promise.all([standardPromise, expressPromise, shipPromise])
      .then(([standardDeliveries, expressDeliveries, shipDeliveries]) => {
        this.standardOptions = standardDeliveries || [];
        this.expressOptions = expressDeliveries || [];
        this.shipOptions = shipDeliveries || [];
        
        // Now that all options are loaded, auto-select and calculate
        this.autoSelectDeliveryOptions();
      })
      .catch(err => {
        console.error('Error loading delivery options:', err);
        // Still try to auto-select with whatever data we have
        this.autoSelectDeliveryOptions();
      });
  }

  autoSelectDeliveryOptions(): void {
    // Auto-select delivery type if not set or invalid
    let deliveryType = this.checkoutForm.get('deliveryType')?.value;
    let validType = deliveryType;
    
    if (!['standard', 'express', 'ship'].includes(deliveryType) || (
      deliveryType === 'standard' && this.standardOptions.length === 0
    ) || (
      deliveryType === 'express' && this.expressOptions.length === 0
    ) || (
      deliveryType === 'ship' && this.shipOptions.length === 0
    )) {
      // Pick the first available type with options
      if (this.standardOptions.length > 0) validType = 'standard';
      else if (this.expressOptions.length > 0) validType = 'express';
      else if (this.shipOptions.length > 0) validType = 'ship';
      else validType = '';
      this.checkoutForm.patchValue({ deliveryType: validType });
    }

    // Always set speed type to the first available option for the selected delivery type
    if (validType === 'standard' && this.standardOptions.length > 0) {
      this.checkoutForm.patchValue({ speedType: this.standardOptions[0].speedType });
    } else if (validType === 'express' && this.expressOptions.length > 0) {
      this.checkoutForm.patchValue({ speedType: this.expressOptions[0].speedType });
    } else if (validType === 'ship' && this.shipOptions.length > 0) {
      this.checkoutForm.patchValue({ speedType: this.shipOptions[0].speedType });
    }

    // Force calculation after setting form values programmatically
    setTimeout(() => {
      this.calculateDeliveryFee();
    }, 0);
  }

  calculateDeliveryFee(): void {
    if (this.isCalculatingDeliveryFee) return;
    this.isCalculatingDeliveryFee = true;
    
    if (!this.currentUser) {
      this.isCalculatingDeliveryFee = false;
      return;
    }

    const deliveryType = this.checkoutForm.get('deliveryType')?.value;
    const speedType = this.checkoutForm.get('speedType')?.value;
    
    if (!deliveryType || !speedType) {
      this.isCalculatingDeliveryFee = false;
      return;
    }

    // Get the selected delivery option
    let selectedOption: Delivery | undefined;
    if (deliveryType === 'standard') {
      selectedOption = this.standardOptions.find(opt => opt.speedType === speedType);
    } else if (deliveryType === 'express') {
      selectedOption = this.expressOptions.find(opt => opt.speedType === speedType);
    } else if (deliveryType === 'ship') {
      selectedOption = this.shipOptions.find(opt => opt.speedType === speedType);
    }

    // Debug logging
    console.log('🔍 Delivery Calculation Debug:', {
      deliveryType,
      speedType,
      selectedOption: selectedOption ? {
        id: selectedOption.id,
        name: selectedOption.name,
        speedType: selectedOption.speedType,
        baseFee: selectedOption.baseFee,
        feePerKm: selectedOption.feePerKm,
        maxFee: selectedOption.maxFee
      } : null,
      standardOptions: this.standardOptions.map(opt => ({ speedType: opt.speedType, baseFee: opt.baseFee })),
      expressOptions: this.expressOptions.map(opt => ({ speedType: opt.speedType, baseFee: opt.baseFee })),
      shipOptions: this.shipOptions.map(opt => ({ speedType: opt.speedType, baseFee: opt.baseFee }))
    });

    if (!selectedOption) {
      this.deliveryFee = 0;
      this.selectedDelayTime = null;
      this.selectedDelayRange = null;
      this.calculatedDistance = 0;
      this.isCalculatingDeliveryFee = false;
      return;
    }

    // Calculate fee using the new backend structure
    const dto: DeliveryFeeRequestDTO = {
      userId: this.currentUser.id,
      deliveryId: selectedOption.id!,
      method: deliveryType,
      name: speedType
    };

    this.deliveryService.calculateStandardFee(dto).subscribe({
      next: (res) => {
        this.calculatedDistance = res.distance;
        
        // Always use frontend calculation for consistency
        this.deliveryFee = this.calculateFeeForOption(selectedOption);
        this.selectedDelayTime = this.getDeliveryTimeForOption(selectedOption);
        this.selectedDelayRange = this.selectedDelayTime; // Direct assignment
        
        // Update suggested method
        const validMethods = ['standard', 'express', 'ship'];
        const backendMethod = (res.suggestedMethod ?? '').toLowerCase();
        const normalizedMethod = validMethods.find(m => m.toLowerCase() === backendMethod);
        const prevMethod = this.checkoutForm.get('deliveryType')?.value;
        this.suggestedMethod = normalizedMethod ? normalizedMethod : deliveryType;
        
        // Auto-change delivery type if backend suggests different
        if (normalizedMethod && normalizedMethod !== prevMethod) {
          this.methodAutoChanged = true;
          this.checkoutForm.patchValue({ deliveryType: this.suggestedMethod });
          setTimeout(() => {
            this.methodAutoChanged = false;
          }, 8000);
        } else if (!normalizedMethod || normalizedMethod === prevMethod) {
          if (!this.methodAutoChanged) {
            this.methodAutoChanged = false;
          }
        }
        
        this.reapplyCouponIfNeeded();
        this.isCalculatingDeliveryFee = false;
      },
      error: () => {
        this.deliveryFee = 0;
        this.suggestedMethod = 'standard';
        this.selectedDelayTime = null;
        this.selectedDelayRange = null;
        this.calculatedDistance = 0;
        this.isCalculatingDeliveryFee = false;
      }
    });
  }



  // Get available speed types for the selected delivery type
  getAvailableSpeedTypes(): Delivery[] {
    const deliveryType = this.checkoutForm.get('deliveryType')?.value;
    if (deliveryType === 'standard') {
      return this.standardOptions;
    } else if (deliveryType === 'express') {
      return this.expressOptions;
    } else if (deliveryType === 'ship') {
      return this.shipOptions;
    }
    return [];
  }

  // Get icon class for delivery type and speed
  getDeliveryIconClass(deliveryType: string, speedType: string): string {
    if (deliveryType === 'standard') {
      if (speedType === 'normal') {
        return 'fa fa-truck';
      } else if (speedType === 'fast') {
        return 'fa fa-bolt';
      } else {
        return 'fa fa-clock';
      }
    } else if (deliveryType === 'express') {
      return 'fa fa-rocket';
    } else if (deliveryType === 'ship') {
      return 'fa fa-ship';
    }
    return 'fa fa-truck';
  }

  // Get delivery display name
  getDeliveryDisplayName(delivery: Delivery): string {
    const speedType = delivery.speedType || 'normal';
    const baseFee = delivery.baseFee || 0;
    const feePerKm = delivery.feePerKm || 0;
    
    if (delivery.deliveryType === 'standard') {
      return `${speedType.charAt(0).toUpperCase() + speedType.slice(1)} (${feePerKm} MMK/km)`;
    } else {
      return `${speedType.charAt(0).toUpperCase() + speedType.slice(1)} (${baseFee} MMK base)`;
    }
  }

  // Get delivery description
  getDeliveryDescription(delivery: Delivery): string {
    const baseDelayHours = delivery.baseDelayHours || 0;
    const baseDelayDays = delivery.baseDelayDays || 0;
    const speedKmHr = delivery.speedKmHr || 30;
    
    if (delivery.deliveryType === 'standard') {
      return `${baseDelayHours}h base + ${speedKmHr} km/h`;
    } else {
      return `${baseDelayDays} days base + ${speedKmHr} km/h`;
    }
  }

  // Calculate fee for a specific delivery option (matches delivery.component.ts)
  calculateFeeForOption(option: Delivery): number {
    if (!this.calculatedDistance || this.calculatedDistance <= 0) return 0;
    const baseFee = option.baseFee || 0;
    const feePerKm = option.feePerKm || 0;
    const maxFee = option.maxFee || 0;
    // Calculate delivery fee based on distance
    let deliveryFee = this.calculatedDistance * feePerKm;
    // Apply base fee logic: if delivery fee is less than base fee, use base fee
    let fee = Math.max(deliveryFee, baseFee);
    // Apply max fee cap if set
    if (maxFee > 0 && fee > maxFee) {
      fee = maxFee;
    }
    return Math.round(fee);
  }

  // Get delivery time for a specific option (matches delivery.component.ts)
  getDeliveryTimeForOption(option: Delivery): string {
    if (!this.calculatedDistance || this.calculatedDistance <= 0) return '';
    if (option.deliveryType === 'standard') {
      const baseHours = option.baseDelayHours || 0;
      const speedKmHr = option.speedKmHr || 30;
      const travelHours = this.calculatedDistance / speedKmHr;
      const totalHours = baseHours + travelHours;
      const days = Math.floor(totalHours / 24);
      const hours = Math.round(totalHours % 24);
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}`.trim();
      } else {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
    } else if (option.deliveryType === 'express' || option.deliveryType === 'ship') {
      const baseDays = option.baseDelayDays || 0;
      const speedKmHr = option.speedKmHr || 30;
      const travelHours = this.calculatedDistance / speedKmHr;
      const totalHours = (baseDays * 24) + travelHours;
      const days = Math.floor(totalHours / 24);
      const hours = Math.round(totalHours % 24);
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}`.trim();
      } else {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
    }
    return '';
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
      
      // Fetch detailed variant information for each cart item
      rawItems.forEach(item => {
        this.productService.getVariantById(item.productVariantId).subscribe({
          next: (variant) => {
            this.variantDetails[item.productVariantId] = variant;
          },
          error: (err) => {
            console.error(`Failed to fetch variant ${item.productVariantId}:`, err);
          }
        });
      });
    } else {
      this.items = [];
    }
  }

  getSubtotal(): number {
    return this.items.reduce((total, item) => {
      const price = (item as any).discountedPrice ?? item.price;
      return total + item.quantity * price;
    }, 0);
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalCost(): number {
    return this.getSubtotal() - this.appliedDiscount + this.deliveryFee;
  }

  applyPromo(): void {
    const code = this.promoCode.trim().toUpperCase();
    this.couponError = '';
    this.couponSuccess = false;

    if (!code || !this.currentUser) {
      this.couponError = 'Please enter a valid promo code.';
      return;
    }

    this.couponService.applyCoupon(code, this.currentUser.id, this.getSubtotal() + this.deliveryFee).subscribe({
      next: (res) => {
        this.appliedDiscount = res.discountAmount;
        this.discountType = res.discountType;
        this.discountValue = res.discountValue;
        this.cartService.setDiscount(res.discountAmount);
        this.cartService.setAppliedCouponCode(code);
        this.cartService.setDiscountType(res.discountType);
        this.cartService.setDiscountValue(res.discountValue);
        this.couponSuccess = true;
        localStorage.setItem('couponApplied', 'true');
      },
      error: (err) => {
        this.appliedDiscount = 0;
        this.discountType = '';
        this.discountValue = '';
        this.cartService.setDiscount(0);
        this.cartService.setAppliedCouponCode('');
        this.cartService.setDiscountType('');
        this.cartService.setDiscountValue('');
        this.couponSuccess = false;
        this.couponError = err.error?.message || err.error || err.message || 'Invalid or expired promo code.';
      }
    });
  }

  submitCheckout(): void {
    if (this.checkoutForm.invalid || !this.currentUser) return;

    const deliveryType = this.checkoutForm.value.deliveryType;
    const speedType = this.checkoutForm.value.speedType;

    // Map cart items to the format expected by the backend
    const mappedItems = this.items.map(item => ({
      variantId: item.productVariantId,
      quantity: item.quantity,
      price: item.price,
      discountPercent: item.discountPercent ?? null,
      discountAmount: (item.discountedPrice != null && item.price != null)
        ? (item.price - item.discountedPrice)
        : null
    }));

    const orderData = {
      userId: this.currentUser.id,
      items: mappedItems,
      subtotal: this.getSubtotal(),
      discountAmount: this.appliedDiscount,
      discountType: this.discountType,
      discountValue: this.discountValue,
      appliedCouponCode: this.promoCode || null,
      total: this.getTotalCost(),
      deliveryFee: this.deliveryFee,
      deliveryMethod: deliveryType,
      deliveryProvider: speedType,
      deliveryAddressId: this.mainAddressId
    };

    console.log('Placing order:', orderData);
    
    this.orderService.placeOrder(orderData).subscribe({
      next: (order) => {
        console.log('Order placed successfully:', order);
        // Clear cart after successful order creation
        this.cartService.clearCart(this.currentUser!.id);
        // Navigate to payment page with the new order ID
        this.router.navigate(['/payment', order.id]);
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed to place order',
          text: 'Please try again.'
        });
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  editAddress(): void {
    this.router.navigate(['/addresslist']);
  }

  private formatAddress(address: AddressDTO): string {
    return `${address.houseNumber || ''}, ${address.street || ''}, ${address.wardName || ''}, ${address.township || ''}, ${address.city || ''}, ${address.state || ''}, ${address.country || ''}, ${address.postalCode || 'N/A'}`;
  }

  isFormValid(): boolean {
    // Check if form is valid and user is logged in
    if (!this.currentUser || this.checkoutForm.invalid) {
      return false;
    }

    // Check if delivery type is selected
    const deliveryType = this.checkoutForm.get('deliveryType')?.value;
    if (!deliveryType) {
      return false;
    }

    // Check if speed type is selected
    const speedType = this.checkoutForm.get('speedType')?.value;
    if (!speedType) {
      return false;
    }

    // Check if cart has items
    if (this.items.length === 0) {
      return false;
    }

    // Check if delivery fee is calculated
    if (this.deliveryFee <= 0) {
      return false;
    }

    return true;
  }

  proceedToCheckout(): void {
    if (this.appliedDiscount > 0) {
      localStorage.setItem('couponApplied', 'true');
    }
    this.router.navigate(['/checkout']);
  }

  private reapplyCouponIfNeeded(): void {
    if (this.promoCode && this.promoCode.trim() !== '') {
      this.applyPromo();
    }
  }

  getItemDiscountedPrice(item: CartItem): number {
    return (item as any).discountedPrice ?? item.price;
  }

  getItemDiscountPercent(item: CartItem): number | null {
    return (item as any).discountPercent ?? null;
  }
}
