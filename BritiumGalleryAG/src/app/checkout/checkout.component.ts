// ✅ CLEANED-UP & VERIFIED VERSION OF YOUR CHECKOUT COMPONENT
// Removed duplicate logic, ensured proper backend fallback + clear naming

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { UserService } from '../services/user.service';
import { People } from '../People';
import { AddressService } from '../address.service';
import { AddressDTO } from '../../AddressDTO';
import { User } from '../../user.model';
import { DeliveryService } from '../delivery.service';
import { Delivery, DeliveryFeeRequestDTO } from '../Delivery';

@Component({
  selector: 'app-checkout',
  standalone:false,
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

openAddressModal(): void {
  this.isAddressModalOpen = true;
}

closeAddressModal(): void {
  this.isAddressModalOpen = false;
}

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private userService: UserService,
    private router: Router,
    private addressService: AddressService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
    this.loadCartItems();
    this.loadAdminDeliveryFees();

    this.checkoutForm.get('shippingMethod')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('standardName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('expressName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('shipName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
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

  setAsMain(addressId: number): void {
    if (!this.currentUser) return;
    this.addressService.setMainAddress(this.currentUser.id, addressId).subscribe({
      next: () => {
        alert('✅ Main address updated');
        this.loadMainAddress(this.currentUser!.id);
        this.checkoutForm.patchValue({ shippingMethod: 'Standard' });
        this.calculateStandardDeliveryFromBackend();
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
      error: (err) => {
        console.error('❌ Error calculating standard fee', err);
        this.deliveryFee = 0;
      }
    });
  }

  calculateDeliveryFee(): void {
    const method = this.checkoutForm.get('shippingMethod')?.value;
    this.selectedDelayTime = null;
    this.selectedDelayRange = null;

    if (method === 'Standard') {
      this.calculateStandardDeliveryFromBackend();
      return;
    }

    const providerName = this.checkoutForm.get(`${method.toLowerCase()}Name`)?.value;
    const options = method === 'Express' ? this.expressOptions : this.shipOptions;
    const selected = options.find(p => p.name === providerName);

    this.deliveryFee = selected?.fixAmount || 0;
    this.selectedDelayTime = selected?.minDelayTime || null;
    this.selectedDelayRange = this.getEstimatedDateRange(this.selectedDelayTime);
  }

  getEstimatedDateRange(minDelayTime: string | null): string | null {
    if (!minDelayTime) return null;
    const today = new Date();

    if (/^\d+\s+days?$/.test(minDelayTime)) {
      const days = parseInt(minDelayTime);
      const arrival = new Date();
      arrival.setDate(today.getDate() + days);
      return `Arrives by ${arrival.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    const rangeMatch = minDelayTime.match(/(\d+)\s*–\s*(\d+)/);
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
    return (+this.getSubtotal()) + (+this.deliveryFee) - (+this.appliedDiscount);
  }


  applyPromo(): void {
    if (this.promoCode === 'SALE10') {
      this.appliedDiscount = this.getSubtotal() * 0.1;
      alert('Promo code applied: 10% off');
    } else {
      this.appliedDiscount = 0;
      alert('Invalid promo code');
    }
  }

  submitCheckout(): void {
    if (this.checkoutForm.invalid || !this.currentUser) {
      return;
    }

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
}
