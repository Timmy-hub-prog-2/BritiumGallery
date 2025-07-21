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
  shipFee: number = 0;
  couponSuccess: boolean = false;
  couponError: string = '';

  discountType: string = '';
  discountValue: string = '';

  mainAddress: string = 'Loading...';
  mainAddressDTO!: AddressDTO;
  addresses: AddressDTO[] = [];
  mainAddressId!: number;
  showAllAddresses = false;

  standardOptions: Delivery[] = [];
  expressOptions: Delivery[] = [];
  shipOptions: Delivery[] = [];

  selectedDelayTime: string | null = null;
  selectedDelayRange: string | null = null;

  suggestedMethod: string = 'Standard';
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
    this.loadAdminDeliveryFees();
    this.appliedDiscount = this.cartService.getDiscount();
    this.promoCode = this.cartService.getAppliedCouponCode();
    this.discountType = this.cartService.getDiscountType();
    this.discountValue = this.cartService.getDiscountValue();

    if (localStorage.getItem('couponApplied') === 'true') {
      this.showCouponAppliedPopup = true;
      localStorage.removeItem('couponApplied');
      setTimeout(() => this.showCouponAppliedPopup = false, 3000);
    }

    // Always recalculate delivery fee when shipping method changes
    this.checkoutForm.get('shippingMethod')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        this.calculateDeliveryFee();
      });

    // Always recalculate delivery fee when provider changes
    this.checkoutForm.get('standardName')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        if (this.checkoutForm.get('shippingMethod')?.value === 'Standard') {
          this.calculateDeliveryFee();
        }
      });
    this.checkoutForm.get('expressName')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        if (this.checkoutForm.get('shippingMethod')?.value === 'Express') {
          this.calculateDeliveryFee();
        }
      });
    this.checkoutForm.get('shipName')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        if (this.checkoutForm.get('shippingMethod')?.value === 'Ship') {
          this.calculateDeliveryFee();
        }
      });
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
      shippingMethod: ['Standard', Validators.required],
      standardName: ['', Validators.required],
      expressName: [''],
      shipName: ['']
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
        this.calculateDeliveryFee();
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
        this.checkoutForm.patchValue({ shippingMethod: 'Standard' });
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

  loadAdminDeliveryFees(): void {
    this.deliveryService.getAllDeliveryTypes().subscribe({
      next: (types: Delivery[]) => {
        this.standardOptions = types.filter(t => t.type === 'STANDARD');
        this.expressOptions = types.filter(t => t.type === 'EXPRESS');
        this.shipOptions = types.filter(t => t.type === 'SHIP');
        const ship = this.shipOptions[0];
        if (ship?.fixAmount) this.shipFee = ship.fixAmount;

        // --- Auto-select shipping method and provider if not set or invalid ---
        let method = this.checkoutForm.get('shippingMethod')?.value;
        let validMethod = method;
        if (!['Standard', 'Express', 'Ship'].includes(method) || (
          method === 'Standard' && this.standardOptions.length === 0
        ) || (
          method === 'Express' && this.expressOptions.length === 0
        ) || (
          method === 'Ship' && this.shipOptions.length === 0
        )) {
          // Pick the first available method with options
          if (this.standardOptions.length > 0) validMethod = 'Standard';
          else if (this.expressOptions.length > 0) validMethod = 'Express';
          else if (this.shipOptions.length > 0) validMethod = 'Ship';
          else validMethod = '';
          this.checkoutForm.patchValue({ shippingMethod: validMethod });
        }

        // Auto-select provider for the selected method if not set
        if (validMethod === 'Standard' && this.standardOptions.length > 0) {
          const current = this.checkoutForm.get('standardName')?.value;
          if (!current || !this.standardOptions.some(opt => opt.name === current)) {
            this.checkoutForm.patchValue({ standardName: this.standardOptions[0].name });
          }
        } else if (validMethod === 'Express' && this.expressOptions.length > 0) {
          const current = this.checkoutForm.get('expressName')?.value;
          if (!current || !this.expressOptions.some(opt => opt.name === current)) {
            this.checkoutForm.patchValue({ expressName: this.expressOptions[0].name });
          }
        } else if (validMethod === 'Ship' && this.shipOptions.length > 0) {
          const current = this.checkoutForm.get('shipName')?.value;
          if (!current || !this.shipOptions.some(opt => opt.name === current)) {
            this.checkoutForm.patchValue({ shipName: this.shipOptions[0].name });
          }
        }

        this.calculateDeliveryFee();
      },
      error: err => console.error('Error loading delivery types', err)
    });
  }

  calculateStandardDeliveryFromBackend(): void {
    if (!this.currentUser) return;

    const selectedStandard = this.standardOptions.find(
      opt => opt.name === this.checkoutForm.get('standardName')?.value
    );

    if (!selectedStandard) return;

    const dto: DeliveryFeeRequestDTO = {
      userId: this.currentUser.id,
      deliveryId: selectedStandard.id!,
      method: 'Standard',
      name: selectedStandard.name
    };

    this.deliveryService.calculateStandardFee(dto).subscribe({
      next: (res) => {
        // Ensure suggestedMethod is always set to a valid value
        const validMethods = ['Standard', 'Express', 'Ship'];
        const backendMethod = (res.suggestedMethod ?? '').toLowerCase();
        const normalizedMethod = validMethods.find(m => m.toLowerCase() === backendMethod);
        this.suggestedMethod = normalizedMethod ? normalizedMethod : 'Standard';
        this.deliveryFee = res.fee;
        this.selectedDelayTime = res.estimatedTime || null;
        this.selectedDelayRange = this.getEstimatedDateRange(this.selectedDelayTime);
        this.reapplyCouponIfNeeded();

        if (this.suggestedMethod !== 'Standard') {
          this.checkoutForm.patchValue({ shippingMethod: this.suggestedMethod });
        }
      },
      error: () => {
        this.deliveryFee = 0;
        this.suggestedMethod = 'Standard';
      }
    });
  }

  calculateDeliveryFee(): void {
    if (this.isCalculatingDeliveryFee) return;
    this.isCalculatingDeliveryFee = true;
    if (!this.currentUser) {
      this.isCalculatingDeliveryFee = false;
      return;
    }

    const method = this.checkoutForm.get('shippingMethod')?.value;
    let selectedOption: Delivery | undefined;
    let providerPatched = false;

    if (method === 'Standard') {
      const current = this.checkoutForm.get('standardName')?.value;
      selectedOption = this.standardOptions.find(opt => opt.name === current);
      if ((!current || current === '') && this.standardOptions.length > 0) {
        this.checkoutForm.patchValue({ standardName: this.standardOptions[0].name });
        providerPatched = true;
      }
    } else if (method === 'Express') {
      const current = this.checkoutForm.get('expressName')?.value;
      selectedOption = this.expressOptions.find(opt => opt.name === current);
      if ((!current || current === '') && this.expressOptions.length > 0) {
        this.checkoutForm.patchValue({ expressName: this.expressOptions[0].name });
        providerPatched = true;
      }
    } else if (method === 'Ship') {
      const current = this.checkoutForm.get('shipName')?.value;
      selectedOption = this.shipOptions.find(opt => opt.name === current);
      if ((!current || current === '') && this.shipOptions.length > 0) {
        this.checkoutForm.patchValue({ shipName: this.shipOptions[0].name });
        providerPatched = true;
      }
    }

    // If we just patched the provider, return and let the next value change trigger calculation
    if (providerPatched) {
      this.isCalculatingDeliveryFee = false;
      return;
    }

    if (!selectedOption) {
      this.selectedDelayTime = null;
      this.selectedDelayRange = null;
      this.isCalculatingDeliveryFee = false;
      return;
    }

    const dto: DeliveryFeeRequestDTO = {
      userId: this.currentUser.id,
      deliveryId: selectedOption.id!,
      method: method,
      name: selectedOption.name
    };

    this.deliveryService.calculateStandardFee(dto).subscribe({
      next: (res) => {
        const validMethods = ['Standard', 'Express', 'Ship'];
        const backendMethod = (res.suggestedMethod ?? '').toLowerCase();
        const normalizedMethod = validMethods.find(m => m.toLowerCase() === backendMethod);
        const prevMethod = this.checkoutForm.get('shippingMethod')?.value;
        this.suggestedMethod = normalizedMethod ? normalizedMethod : method;
        this.deliveryFee = res.fee;
        this.selectedDelayTime = res.estimatedTime || null;
        this.selectedDelayRange = this.getEstimatedDateRange(this.selectedDelayTime);
        this.reapplyCouponIfNeeded();
        if (normalizedMethod && normalizedMethod !== prevMethod) {
          this.methodAutoChanged = true;
          this.checkoutForm.patchValue({ shippingMethod: this.suggestedMethod });
          setTimeout(() => {
            this.methodAutoChanged = false;
          }, 8000); // Show notice for 8 seconds
        } else if (!normalizedMethod || normalizedMethod === prevMethod) {
          if (!this.methodAutoChanged) {
            this.methodAutoChanged = false;
          }
        }
        this.isCalculatingDeliveryFee = false;
      },
      error: () => {
        this.deliveryFee = 0;
        this.suggestedMethod = 'Standard';
        this.selectedDelayTime = null;
        this.selectedDelayRange = null;
        this.isCalculatingDeliveryFee = false;
      }
    });
  }

  getEstimatedDateRange(minDelayTime: string | null): string | null {
    if (!minDelayTime) return null;
    const today = new Date();
    const trimmed = minDelayTime.trim();

    // Accept 'Day' or 'Days', case-insensitive
    if (/^\d+\s+days?$/i.test(trimmed)) {
      const days = parseInt(trimmed);
      const arrival = new Date();
      arrival.setDate(today.getDate() + days);
      return `Arrives by ${arrival.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    // Accept ranges like '2–4 Days' (en dash or hyphen)
    const rangeMatch = trimmed.match(/(\d+)\s*[–-]\s*(\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      const start = new Date();
      const end = new Date();
      start.setDate(today.getDate() + min);
      end.setDate(today.getDate() + max);
      return `Arrives between ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    return null;
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

    const method = this.checkoutForm.value.shippingMethod;
    const provider = this.checkoutForm.value[`${method.toLowerCase()}Name`];

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
      deliveryMethod: method,
      deliveryProvider: provider,
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

    // Check if shipping method is selected
    const shippingMethod = this.checkoutForm.get('shippingMethod')?.value;
    if (!shippingMethod) {
      return false;
    }

    // Check if provider is selected for the shipping method
    const providerField = `${shippingMethod.toLowerCase()}Name`;
    const provider = this.checkoutForm.get(providerField)?.value;
    if (!provider) {
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

  shippingMethodProviderField(): string {
    const method = this.checkoutForm.get('shippingMethod')?.value;
    return method ? `${method.toLowerCase()}Name` : '';
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
