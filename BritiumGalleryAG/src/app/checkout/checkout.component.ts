import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { UserService } from '../services/user.service';
import { People } from '../People';
import { AddressService } from '../address.service';
import { AddressDTO } from '../../AddressDTO';
import { DeliveryService } from '../delivery.service';
import { Delivery, DeliveryFeeRequestDTO } from '../Delivery';
import { CouponService } from '../services/coupon.service';
import { Payment, PaymentService } from '../payment.service';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
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

  payments: Payment[] = [];
  selectedQrUrl: string = '';

  selectedDelayTime: string | null = null;
  selectedDelayRange: string | null = null;

  suggestedMethod: string = 'Standard';
  isAddressModalOpen = false;
  selectedReceiptFile: File | null = null;
  receiptPreviewUrl = '';
  showReceiptPreview = false;
  showManualPayment = false;
  isAdminView = false;
  methodAutoChanged = false;
  showCouponAppliedPopup = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private userService: UserService,
    private router: Router,
    private addressService: AddressService,
    private deliveryService: DeliveryService,
    private couponService: CouponService,
    private paymentService: PaymentService
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

    // Show popup if coupon was applied in cart
    if (localStorage.getItem('couponApplied') === 'true') {
      this.showCouponAppliedPopup = true;
      localStorage.removeItem('couponApplied');
      setTimeout(() => this.showCouponAppliedPopup = false, 3000); // Hide after 3 seconds
    }

    this.checkoutForm.get('shippingMethod')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('standardName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('expressName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('shipName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());

    this.paymentService.getAll().subscribe({
      next: (data) => {
        this.payments = (data as any[]).map(p => ({
          ...p,
          qrPhotoUrl: Array.isArray(p.qrPhotoUrls) && p.qrPhotoUrls.length > 0 ? p.qrPhotoUrls[0] : ''
        }));
        this.updateSelectedQrUrl();
      },
      error: (err) => console.error('❌ Error loading payment data', err)
    });

    this.checkoutForm.get('paymentType')?.valueChanges.subscribe(() => {
      this.updateSelectedQrUrl();
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
      shipName: [''],
      paymentType: ['CreditCard', Validators.required],
      cardNumber: ['', Validators.required],
      expiry: ['', Validators.required],
      cvv: ['', Validators.required]
    });
  }

  updateSelectedQrUrl(): void {
    const selected = this.checkoutForm.get('paymentType')?.value;
    const match = this.payments.find(p => p.name.toLowerCase() === selected?.toLowerCase());
    if (match && match.qrPhotoUrl) {
      this.selectedQrUrl = match.qrPhotoUrl;
    } else {
      this.selectedQrUrl = '';
    }
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
        alert('✅ Main address updated');
        this.loadMainAddress(this.currentUser!.id);
        this.checkoutForm.patchValue({ shippingMethod: 'Standard' });
        this.calculateDeliveryFee();
        this.closeAddressModal();
      },
      error: err => alert('❌ Failed to update main address')
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
        this.suggestedMethod = res.suggestedMethod || 'Standard';
        this.deliveryFee = res.fee;
        this.selectedDelayTime = res.estimatedTime || null;
        this.selectedDelayRange = this.getEstimatedDateRange(this.selectedDelayTime);

        if (res.suggestedMethod !== 'Standard') {
          this.checkoutForm.patchValue({ shippingMethod: res.suggestedMethod });
        }
      },
      error: () => {
        this.deliveryFee = 0;
      }
    });
  }

  calculateDeliveryFee(): void {
    console.log('calculateDeliveryFee called');
    if (!this.currentUser) return;

    const method = this.checkoutForm.get('shippingMethod')?.value;
    let selectedOption: Delivery | undefined;
    let providerPatched = false;

    if (method === 'Standard') {
      if (!this.checkoutForm.get('standardName')?.value && this.standardOptions.length > 0) {
        this.checkoutForm.patchValue({ standardName: this.standardOptions[0].name });
        providerPatched = true;
      }
      selectedOption = this.standardOptions.find(opt => opt.name === this.checkoutForm.get('standardName')?.value);
    } else if (method === 'Express') {
      if (!this.checkoutForm.get('expressName')?.value && this.expressOptions.length > 0) {
        this.checkoutForm.patchValue({ expressName: this.expressOptions[0].name });
        providerPatched = true;
      }
      selectedOption = this.expressOptions.find(opt => opt.name === this.checkoutForm.get('expressName')?.value);
    } else if (method === 'Ship') {
      if (!this.checkoutForm.get('shipName')?.value && this.shipOptions.length > 0) {
        this.checkoutForm.patchValue({ shipName: this.shipOptions[0].name });
        providerPatched = true;
      }
      selectedOption = this.shipOptions.find(opt => opt.name === this.checkoutForm.get('shipName')?.value);
    }

    // If we just patched the provider, re-run the calculation after the form updates
    if (providerPatched) {
      setTimeout(() => this.calculateDeliveryFee(), 0);
      return;
    }

    if (!selectedOption) return;

    const dto: DeliveryFeeRequestDTO = {
      userId: this.currentUser.id,
      deliveryId: selectedOption.id!,
      method: method,
      name: selectedOption.name
    };

    this.deliveryService.calculateStandardFee(dto).subscribe({
      next: (res) => {
        const prevMethod = this.checkoutForm.get('shippingMethod')?.value;
        this.suggestedMethod = res.suggestedMethod || method;
        this.deliveryFee = res.fee;
        this.selectedDelayTime = res.estimatedTime || null;
        this.selectedDelayRange = this.getEstimatedDateRange(this.selectedDelayTime);
        if (res.suggestedMethod && res.suggestedMethod !== method) {
          this.methodAutoChanged = true;
          this.checkoutForm.patchValue({ shippingMethod: res.suggestedMethod });
          setTimeout(() => {
            this.methodAutoChanged = false;
          }, 8000); // Show notice for 8 seconds
        } else if (!res.suggestedMethod || res.suggestedMethod === method) {
          // Only set to false if it was never set to true
          if (!this.methodAutoChanged) {
            this.methodAutoChanged = false;
          }
        }
        // Debug logs
        console.log('methodAutoChanged:', this.methodAutoChanged);
        console.log('selectedDelayRange:', this.selectedDelayRange);
        console.log('shippingMethod:', this.checkoutForm.get('shippingMethod')?.value);
      },
      error: () => {
        this.deliveryFee = 0;
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
    this.items = this.currentUser ? this.cartService.getCartItems(this.currentUser.id) : [];
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalCost(): number {
    return this.getSubtotal() + this.deliveryFee - this.appliedDiscount;
  }

  applyPromo(): void {
    const code = this.promoCode.trim().toUpperCase();
    this.couponError = '';
    this.couponSuccess = false;

    if (!code || !this.currentUser) {
      this.couponError = 'Please enter a valid promo code.';
      return;
    }

    this.couponService.applyCoupon(code, this.currentUser.id, this.getSubtotal()).subscribe({
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
        this.couponError = err.error?.message || 'Invalid or expired promo code.';
      }
    });
  }

  submitCheckout(): void {
    if (this.checkoutForm.invalid || !this.currentUser) return;

    const method = this.checkoutForm.value.shippingMethod;
    const provider = this.checkoutForm.value[`${method.toLowerCase()}Name`];

    const orderData = {
      userId: this.currentUser.id,
      shippingDetails: this.checkoutForm.value,
      items: this.items,
      total: this.getTotalCost(),
      promoCode: this.promoCode || null,
      shippingMethod: method,
      providerName: provider
    };

    console.log('Order placed:', orderData);
    alert('Your order has been placed!');
    this.cartService.clearCart(this.currentUser.id);
    this.router.navigate(['/order-confirmation']);
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

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  getQRCodeUrl(): string {
    if (this.selectedQrUrl) return this.selectedQrUrl;
    const amount = this.getTotalCost();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Payment Amount: MMK ${amount}`;
  }

  isFormValid(): boolean {
    const paymentType = this.checkoutForm.get("paymentType")?.value;
    if (paymentType && paymentType !== "CreditCard") {
      return this.selectedReceiptFile !== null;
    }
    if (paymentType === "CreditCard") {
      const cardNumber = this.checkoutForm.get("cardNumber")?.value;
      const expiry = this.checkoutForm.get("expiry")?.value;
      const cvv = this.checkoutForm.get("cvv")?.value;
      return cardNumber && expiry && cvv;
    }
    return false;
  }

  onReceiptFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      this.selectedReceiptFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.receiptPreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeReceiptFile(event: Event): void {
    event.stopPropagation();
    this.selectedReceiptFile = null;
    this.receiptPreviewUrl = '';
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  closeReceiptPreview(): void {
    this.showReceiptPreview = false;
  }

  approvePayment(): void {
    console.log("Payment approved");
  }

  rejectPayment(): void {
    console.log("Payment rejected");
  }

  getPaymentLogoClass(): string {
    const paymentType = this.checkoutForm.get('paymentType')?.value;
    switch ((paymentType || '').toLowerCase()) {
      case 'kpay': return 'kpay';
      case 'wavemoney': return 'wavemoney';
      case 'cbpay': return 'cbpay';
      default: return '';
    }
  }

  getPaymentIcon(): string {
    const paymentType = this.checkoutForm.get('paymentType')?.value;
    switch ((paymentType || '').toLowerCase()) {
      case 'kpay': return '💸';
      case 'wavemoney': return '🌊';
      case 'cbpay': return '🏦';
      default: return '💳';
    }
  }

  proceedToCheckout(): void {
    if (this.appliedDiscount > 0) {
      localStorage.setItem('couponApplied', 'true');
    }
    this.router.navigate(['/checkout']);
  }
}
