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
  mainAddress: string = 'Loading...';

  user: User = {
    id: 0,
    name: '',
    email: '',
    phoneNumber: '',
    imageUrls: [],
    gender: '',
    password: '',
    status: 0,
    roleId: 3,
    address: '',
  };

  deliveryFee: number = 0;
  adminExpressFee = 0;
  shipFee: number = 0;

  standardOptions: Delivery[] = [];
  expressOptions: Delivery[] = [];
  shipOptions: Delivery[] = [];
  selectedDelayTime: string | null = null;
  selectedDelayRange: string | null = null;

  private getEstimatedDateRange(minDelayTime: string): string | null {
    const today = new Date();
    if (/^\d+\s+days?$/.test(minDelayTime)) {
      const days = parseInt(minDelayTime);
      const arrival = new Date(today);
      arrival.setDate(today.getDate() + days);
      return `Arrives by ${arrival.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (/^\d+\s*–\s*\d+\s+days?$/.test(minDelayTime)) {
      const [min, max] = minDelayTime.match(/\d+/g)!.map(Number);
      const start = new Date(today);
      const end = new Date(today);
      start.setDate(today.getDate() + min);
      end.setDate(today.getDate() + max);
      const formattedStart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Arrives between ${formattedStart} – ${formattedEnd}`;
    }
    return null;
  }

  loadAdminDeliveryFees(): void {
    this.deliveryService.getAllDeliveryTypes().subscribe({
      next: (types: Delivery[]) => {
        this.expressOptions = types.filter(t => t.type === 'EXPRESS');
        this.shipOptions = types.filter(t => t.type === 'SHIP');
        this.standardOptions = types.filter(t => t.type === 'STANDARD');
        const ship = this.shipOptions[0];
        if (ship?.fixAmount != null) this.shipFee = ship.fixAmount;
        this.calculateDeliveryFee();
      },
      error: err => {
        console.error('Error loading delivery types', err);
      }
    });
  }

  calculateStandardDeliveryFromBackend(): void {
    if (!this.currentUser) {
      console.warn('❌ No logged-in user found');
      return;
    }

    const selectedStandard = this.standardOptions.find(opt =>
      opt.name === this.checkoutForm.get('standardName')?.value
    );

    if (!selectedStandard) {
      console.warn('❌ No standard delivery option selected');
      return;
    }

    const dto: DeliveryFeeRequestDTO = {
      userId: this.currentUser.id,
      deliveryId: selectedStandard.id!,
      method: 'Standard',
      name: selectedStandard.name
    };

    this.deliveryService.calculateStandardFee(dto).subscribe({
      next: (res) => {
        this.deliveryFee = res.fee;  // Backend sends 'fee' not 'deliveryFee'
        this.selectedDelayTime = selectedStandard.minDelayTime || null;
        this.selectedDelayRange = this.selectedDelayTime
          ? this.getEstimatedDateRange(this.selectedDelayTime)
          : null;

        console.log('✅ Fee from backend:', res);
      },
      error: (err) => {
        console.error('❌ Error calculating standard delivery fee', err);
        this.deliveryFee = 0;
      }
    });
  }

  calculateDeliveryFee(): void {
    const shippingMethod = this.checkoutForm.get('shippingMethod')?.value;
    this.selectedDelayTime = null;
    this.selectedDelayRange = null;

    if (shippingMethod === 'Express') {
      const expressName = this.checkoutForm.get('expressName')?.value;
      const selected = this.expressOptions.find(e => e.name === expressName);
      this.deliveryFee = selected?.fixAmount || 0;
      this.selectedDelayTime = selected?.minDelayTime || null;
    } else if (shippingMethod === 'Ship') {
      const shipName = this.checkoutForm.get('shipName')?.value;
      const selected = this.shipOptions.find(s => s.name === shipName);
      this.deliveryFee = selected?.fixAmount || 0;
      this.selectedDelayTime = selected?.minDelayTime || null;
    } else if (shippingMethod === 'Standard') {
      this.calculateStandardDeliveryFromBackend(); // ✅ delegate to backend
      return; // wait for async result
    } else {
      this.deliveryFee = 0;
    }

    this.selectedDelayRange = this.selectedDelayTime
      ? this.getEstimatedDateRange(this.selectedDelayTime)
      : null;
  }

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private userService: UserService,
    private router: Router,
    private addressService: AddressService,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
    this.loadCartItems();
    this.loadAdminDeliveryFees();
    this.checkoutForm.get('shippingMethod')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('standardName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('expressName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    this.checkoutForm.get('shipName')?.valueChanges.subscribe(() => this.calculateDeliveryFee());
    if (this.currentUser) {
      this.loadMainAddress(this.currentUser.id);
    }
  }

  loadMainAddress(userId: number): void {
    this.addressService.getMainAddressByUserId(userId).subscribe({
      next: (address: AddressDTO) => {
        this.mainAddress = `${address.houseNumber}, ${address.wardName},${address.street}, ${address.township}, ${address.city},${address.state}`;
      },
      error: (err) => {
        console.error('Error loading main address', err);
        this.mainAddress = 'No address found';
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

      shippingMethod: ['Standard', Validators.required], // Default to Standard
      standardName: ['', Validators.required],
      expressName: [''],
      shipName: [''],
      paymentType: ['CreditCard', Validators.required],
      cardNumber: ['', Validators.required],
      expiry: ['', Validators.required],
      cvv: ['', Validators.required]
    });
  }

  private loadCurrentUser(): void {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      this.currentUser = JSON.parse(loggedInUser) as People;
      const addr = this.currentUser.address || {};
      this.checkoutForm.patchValue({
        name: this.currentUser.name || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phoneNumber || '',
        houseNumber: addr.houseNumber || '',
        wardName: addr.wardName || '',
        street: addr.street || '',
        township: addr.township || '',
        city: addr.city || '',
        state: addr.state || ''
      });
      this.loadMainAddress(this.currentUser.id);
    }
  }

  private loadCartItems(): void {
    this.items = this.currentUser ? this.cartService.getCartItems(this.currentUser.id) : [];
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }

  //  getTotalCost(): number {
  //    return this.getSubtotal() + this.deliveryFee - this.appliedDiscount;
  //  }

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
    if (this.checkoutForm.invalid) {
      alert('Please fill out all required fields.');
      return;
    }

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const shippingMethod = this.checkoutForm.value.shippingMethod;
    let providerName = '';
    if (shippingMethod === 'Express') {
      providerName = this.checkoutForm.value.expressName;
    } else if (shippingMethod === 'Ship') {
      providerName = this.checkoutForm.value.shipName;
    }

    const orderData = {
      userId: this.currentUser.id,
      shippingDetails: this.checkoutForm.value,
      items: this.items,
      total: this.getTotalCost(),
      promoCode: this.promoCode || null,
      shippingMethod: shippingMethod
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
}
