import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { CustomerDetailService } from '../customer-detail.service';

@Component({
  selector: 'app-view-customer-detail',
  standalone:false,
  templateUrl: './view-customer-detail.component.html',
  styleUrls: ['./view-customer-detail.component.css']
})
export class ViewCustomerDetailComponent implements OnInit {
  customerId!: number;
  personalInfo: any;
  orders: any[] = [];
  refunds: any[] = [];
  remainders: any[] = [];
  wishlist: any[] = [];
objectKeys = Object.keys;

  constructor(
    private route: ActivatedRoute,
    private customerDetailService: CustomerDetailService,
     private router: Router
  
  ) {}

  ngOnInit(): void {
    this.customerId = +this.route.snapshot.paramMap.get('id')!;
    this.loadAllDetails();
  }

  
    viewOrderDetails(orderId: number): void {
      this.router.navigate(['/admin-order-detail', orderId]);
    }

  loadAllDetails(): void {
    this.customerDetailService.getPersonalInfo(this.customerId).subscribe({
      next: (data) => {
        this.personalInfo = data;
        console.log('Personal Info:', this.personalInfo);
      },
      error: (error) => {
        console.error('Error loading personal info:', error);
      }
    });

    this.customerDetailService.getOrders(this.customerId).subscribe({
      next: (data) => {
        this.orders = data;
        console.log('Orders:', this.orders);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });

    this.customerDetailService.getRefunds(this.customerId).subscribe({
      next: (data) => {
        this.refunds = data;
        console.log('Refunds:', this.refunds);
      },
      error: (error) => {
        console.error('Error loading refunds:', error);
      }
    });

    this.customerDetailService.getRemainders(this.customerId).subscribe({
      next: (data) => {
        this.remainders = data;
        console.log('Remainders:', this.remainders);
      },
      error: (error) => {
        console.error('Error loading remainders:', error);
      }
    });

    this.customerDetailService.getWishlist(this.customerId).subscribe({
      next: (data) => {
        this.wishlist = data;
        console.log('Wishlist:', this.wishlist);
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
      }
    });
  }

  getSpendPercent(total: number): number {
    if (!total) return 0;
    const maxSpend = 6000000; // Maximum spend for VIP status
    return Math.min((total / maxSpend) * 100, 100);
  }

  getFullAddress(address: any): string {
    if (!address) return '';
    
    const parts = [
      address.houseNumber,
      address.street,
      address.wardName,
      address.township,
      address.city,
      address.state
    ];
    
    // Filter out null, undefined, or empty string values
    const validParts = parts.filter(part => part && part.trim() !== '');
    
    return validParts.length > 0 ? validParts.join(', ') : '';
  }

  getCustomerTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'vip':
        return 'badge-vip';
      case 'loyalty':
        return 'badge-loyalty';
      default:
        return 'badge-normal';
    }
  }

  getCustomerStatus(spend: number): string {
    if (!spend) return 'Normal';
    if (spend >= 6000000) return 'VIP';
    if (spend >= 3000000) return 'Loyalty';
    return 'Normal';
  }
}