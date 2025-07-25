import { Component, OnInit } from '@angular/core';
import { CouponService } from '../services/coupon.service';
import { Coupon } from '../Coupon';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

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

  selectedStatus: string = ''; // default to show all
  filterByStatus(status: string): void {
    console.log('Selected status:', status);  // Track the status
    this.selectedStatus = status;

    if (!status) {
      // Show all coupons
      this.filteredCoupons = this.coupons;
    } else {
      // Filter by selected status
      this.filteredCoupons = this.coupons.filter(c => c.status === status);
    }

    this.filterCoupons(); // Reapply search term filtering if needed
  }


  constructor(private couponService: CouponService, private snackBar: MatSnackBar) {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
  }

  showSuccess(msg: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: msg,
      timer: 2000,
      showConfirmButton: false,
     
    });
  }

  getCustomerTypeName(id: number): string {
    const type = this.customerTypes.find(ct => ct.id === id);
    return type ? type.name : 'Unknown';
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.couponService.getCoupons().subscribe(data => {
      console.log(data);
      this.coupons = data;
      this.filterCoupons();
    });
  }

  // filterCoupons(): void {
  //   const term = this.searchTerm.toLowerCase().trim();
  //   if (!term) {
  //     this.filteredCoupons = this.coupons;
  //   } else {
  //     this.filteredCoupons = this.coupons.filter(coupon =>
  //       coupon.code?.toLowerCase().includes(term) ||
  //       coupon.type?.toLowerCase().includes(term)
  //     );
  //   }
  // }

  filterCoupons(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredCoupons = this.coupons.filter(coupon => {
      // Check if coupon code or type matches the search term
      const matchesSearch = coupon.code?.toLowerCase().includes(term) || coupon.type?.toLowerCase().includes(term);

      // Apply the status filter (either Active, Inactive, or All)
      const matchesStatus = this.selectedStatus ? coupon.status === this.selectedStatus : true;

      // Return true if both conditions match
      return matchesSearch && matchesStatus;
    });
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
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Please correct the coupon code format.',
        confirmButtonColor: '#f59e0b'
      });

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
    Swal.fire({
  icon: 'warning',
  title: 'Incomplete Form',
  text: 'Please fill in all required fields.',
  confirmButtonColor: '#f59e0b'
});

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
      ? this.couponService.updateCouponWithRules(this.newCoupon)
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

    // Reset all types
    this.customerTypes.forEach(type => (type.enabled = false));
    this.usageRules = [];

    // Set usageRules and enabled types
    if (coupon.rules && coupon.rules.length > 0) {
      for (let rule of coupon.rules) {
        this.usageRules.push({ customerTypeId: rule.customerTypeId, times: rule.times });

        const type = this.customerTypes.find(t => t.id === rule.customerTypeId);
        if (type) {
          type.enabled = true;
        }
      }

      const enabledTypes = this.customerTypes.filter(t => t.enabled);

      // Auto select customer type in dropdown
      if (enabledTypes.length === this.customerTypes.length) {
        this.selectedCustomerType = 'all';
      } else if (enabledTypes.length === 1) {
        this.selectedCustomerType = enabledTypes[0].name.toLowerCase();
      } else {
        this.selectedCustomerType = '';
      }
    } else {
      this.selectedCustomerType = '';
    }
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

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.couponService.deleteCoupon(code).subscribe({
          next: () => {
            this.loadCoupons();
            Swal.fire('Deleted!', 'The coupon has been deleted.', 'success');
          },
          error: (err) => {
            console.error(err);
            this.showError('An error occurred while deleting the coupon.');
          }
        });
      }
    });

  }
  showError(msg: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Oops!',
      text: msg,
      confirmButtonColor: '#d33'
    });
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

  get activeCouponsCount(): number {
    return this.coupons.filter(c => c.status === 'Active').length;
  }

  get inactiveCouponsCount(): number {
    return this.coupons.filter(c => c.status === 'Inactive').length;
  }

  get totalRulesCount(): number {
    return this.coupons.reduce((acc, c) => acc + (c.rules?.length || 0), 0);
  }

}
