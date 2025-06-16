import { Component, OnInit } from '@angular/core';
import { CouponService } from '../services/coupon.service';
import { Coupon } from '../coupon';
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

  customCodeEnabled: boolean = false;

  newCoupon: Coupon = {
    code: '',
    type: '',
    discount: '',
    status: 'Active',
    startDate: '',
    endDate: ''
  };

  todayDate: string;
  codeError: boolean = false;
  formSubmitted: boolean = false;

  
  constructor(private couponService: CouponService,private snackBar: MatSnackBar) {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
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
    this.customCodeEnabled = false;
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
      endDate: ''
    };
 this.formSubmitted = false;
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
    !!this.newCoupon.endDate &&
    !this.codeError // Directly check for boolean value of codeError
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

  createCoupon(): void {
    // Validate manual code entry
    if (this.customCodeEnabled) {
      this.validateCouponCode();
      if (this.codeError) {
        alert('Invalid coupon code format. Please correct it.');
        return;
      }
    } else if (!this.isEditMode) {
      // Only generate new code when creating
      this.newCoupon.code = this.generateCouponCode();
    }

    // Optional: Validate date range if both provided
    if (this.newCoupon.startDate && this.newCoupon.endDate) {
      const start = new Date(this.newCoupon.startDate);
      const end = new Date(this.newCoupon.endDate);
      if (end < start) {
        alert('End date cannot be before start date.');
        return;
      }
    }
    // Check if all required fields are filled
    if (!this.newCoupon.code || !this.newCoupon.type || !this.newCoupon.discount || !this.newCoupon.startDate || !this.newCoupon.endDate) {
      alert('Please fill in all fields.');
      return;
    }


    // Submit to backend
    if (this.isEditMode) {
      this.couponService.updateCoupon(this.newCoupon).subscribe(() => {
        this.loadCoupons();
        this.closeModal();
        this.resetForm();
        this.formSubmitted = true;
          this.showSuccess('Coupon updated successfully!');
      });
    } else {
      this.couponService.createCoupon(this.newCoupon).subscribe(() => {
        this.loadCoupons();
        this.closeModal();
        this.resetForm();
        this.formSubmitted = true;
        this.showSuccess('Coupon created successfully!');
      });
    }
  }



  editCoupon(coupon: Coupon): void {
    this.newCoupon = { ...coupon };
    this.isEditMode = true;
    this.showModal = true;
    this.customCodeEnabled = true;

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
 
}
