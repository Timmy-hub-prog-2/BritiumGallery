import { Component, OnInit } from '@angular/core';
import { CouponService } from '../services/coupon.service';
import { Coupon } from '../Coupon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-coupon',
  standalone: false,
  templateUrl: './coupon.component.html',
  styleUrls: ['./coupon.component.css']
})
export class CouponComponent implements OnInit {
  coupons: Coupon[] = [];
  filteredCoupons: Coupon[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  isEditMode: boolean = false;
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  newCoupon: Coupon = {
    code: '',
    type: '',
    discount: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    rules: []
  };

  customerTypes = [
    { id: 1, name: 'Normal', enabled: false },
    { id: 2, name: 'Loyalty', enabled: false },
    { id: 3, name: 'VIP', enabled: false }
  ];

  usageRules: { customerTypeId: number, times: number }[] = [];

  todayDate: string;
  codeError: boolean = false;
  formSubmitted: boolean = false;

  showCustomerTypeRules: boolean = false;
  allCustomerTypesEnabled: boolean = false;
  selectedCustomerType: string = '';
  noExpiry: boolean = false;

  constructor(private couponService: CouponService, private snackBar: MatSnackBar) {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
  }

  showSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.couponService.getCoupons().subscribe(data => {
      this.coupons = data;
      this.filterCoupons();
    });
  }

  filterCoupons(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredCoupons = this.coupons;
    } else {
      this.filteredCoupons = this.coupons.filter(coupon =>
        coupon.code?.toLowerCase().includes(term) ||
        coupon.type?.toLowerCase().includes(term)
      );
    }
  }

  openModal(): void {
    this.resetForm();
    this.showModal = true;
    this.isEditMode = false;
    this.showCustomerTypeRules = false;
    this.selectedCustomerType = '';
  }

  closeModal(): void {
    this.showModal = false;
  }

  resetForm(): void {
    this.newCoupon = {
      code: '',
      type: '',
      discount: '',
      status: 'Active',
      startDate: '',
      endDate: '',
      rules: []
    };
    this.formSubmitted = false;
    this.customerTypes.forEach(type => type.enabled = false);
    this.usageRules = [];
    this.showCustomerTypeRules = false;
    this.selectedCustomerType = '';
    this.noExpiry = false;
  }

  validateCouponCode(): void {
    const pattern = /^[A-Z]{3}[0-9]{3}$/;
    this.codeError = !pattern.test(this.newCoupon.code);
  }

  isFormValid(): boolean {
    return (
      !!this.newCoupon.code &&
      !!this.newCoupon.type &&
      !!this.newCoupon.discount &&
      !!this.newCoupon.startDate &&
      !this.codeError
    );
  }

  generateCouponCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let letterPart = '';
    let numberPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
      numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return letterPart + numberPart;
  }

  getUsageTimes(customerTypeId: number): number {
    const rule = this.usageRules.find(r => r.customerTypeId === customerTypeId);
    return rule ? rule.times : 1;
  }

  setUsageTimes(customerTypeId: number, value: number): void {
    const rule = this.usageRules.find(r => r.customerTypeId === customerTypeId);
    if (rule) {
      rule.times = value;
    } else {
      this.usageRules.push({ customerTypeId, times: value });
    }
  }

  toggleNoExpiry(event: any): void {
    this.noExpiry = event.target.checked;
    if (this.noExpiry) {
      this.newCoupon.endDate = null;
    }
  }

  createCoupon(): void {
    this.validateCouponCode();
    if (this.codeError) {
      alert('Invalid coupon code format. Please correct it.');
      return;
    }

    if (this.newCoupon.startDate && this.newCoupon.endDate) {
      const start = new Date(this.newCoupon.startDate);
      const end = new Date(this.newCoupon.endDate);
      if (end < start) {
        alert('End date cannot be before start date.');
        return;
      }
    }

    if (!this.isFormValid()) {
      alert('Please fill in all required fields.');
      return;
    }

    this.newCoupon.rules = this.customerTypes
      .filter(type => type.enabled)
      .map(type => {
        const rule = this.usageRules.find(r => r.customerTypeId === type.id);
        return { customerTypeId: type.id, times: rule?.times || 1 };
      });

    if (this.noExpiry) {
      this.newCoupon.endDate = null;
    }

    const request = this.isEditMode
      ? this.couponService.updateCoupon(this.newCoupon)
      : this.couponService.createCoupon(this.newCoupon);

    request.subscribe(() => {
      this.loadCoupons();
      this.closeModal();
      this.resetForm();
      this.formSubmitted = true;
      this.showSuccess(`Coupon ${this.isEditMode ? 'updated' : 'created'} successfully!`);
    });
  }

  editCoupon(coupon: Coupon): void {
    this.newCoupon = { ...coupon };
    this.isEditMode = true;
    this.showModal = true;

    this.customerTypes.forEach(type => {
      const rule = coupon.rules?.find(r => r.customerTypeId === type.id);
      type.enabled = !!rule;
      if (rule) {
        this.setUsageTimes(type.id, rule.times);
      }
    });
  }

  updateCoupon(): void {
    this.couponService.updateCoupon(this.newCoupon).subscribe(() => {
      this.loadCoupons();
      this.closeModal();
      this.showSuccess('Coupon updated successfully!');
    });
  }

  deleteCoupon(code: string | undefined): void {
    if (!code) {
      alert('Coupon code is missing.');
      return;
    }

    if (confirm('Are you sure you want to delete this coupon?')) {
      this.couponService.deleteCoupon(code).subscribe(() => {
        this.loadCoupons();
      });
    }
  }

  sortCoupons(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredCoupons.sort((a, b) => {
      let valueA: any = a[field as keyof Coupon];
      let valueB: any = b[field as keyof Coupon];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      if (field === 'validThrough') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (field === 'discount') {
        valueA = parseFloat(valueA);
        valueB = parseFloat(valueB);
      } else {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      }

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  toggleCustomerTypeRules(): void {
    this.showCustomerTypeRules = !this.showCustomerTypeRules;
  }

  toggleAllCustomerTypes(): void {
    if (this.allCustomerTypesEnabled) {
      this.customerTypes.forEach(type => type.enabled = true);
    } else {
      this.customerTypes.forEach(type => type.enabled = false);
    }
  }

  onCustomerTypeChange(): void {
    this.allCustomerTypesEnabled = this.customerTypes.every(type => type.enabled);
  }

  onCustomerTypeSelectionChange(): void {
    this.customerTypes.forEach(type => type.enabled = false);

    if (this.selectedCustomerType === 'all') {
      this.customerTypes.forEach(type => type.enabled = true);
    } else if (this.selectedCustomerType) {
      const selectedType = this.customerTypes.find(type =>
        type.name.toLowerCase() === this.selectedCustomerType
      );
      if (selectedType) {
        selectedType.enabled = true;
      }
    }
  }

  generateAndSetCode(): void {
    this.newCoupon.code = this.generateCouponCode();
    this.codeError = false;
  }

  onCouponCodeClick(): void {
    if (!this.newCoupon.code || this.newCoupon.code.trim() === '') {
      this.generateAndSetCode();
    }
  }
}
