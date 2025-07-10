import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-customer-order-detail',
  standalone: false,
  templateUrl: './customer-order-detail.component.html',
  styleUrl: './customer-order-detail.component.css'
})
export class CustomerOrderDetailComponent implements OnInit, OnDestroy {
  orderId: number | null = null;
  order: any = null;
  transaction: any = null;
  loading = false;
  error = '';
  showReceiptModal = false;
  showAllItemsModal = false;
  countdown: string = '';
  countdownInterval: any = null;
  showPayButton: boolean = false;

  constructor(private route: ActivatedRoute, private orderService: OrderService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orderId = +params['orderId'];
      if (this.orderId) {
        this.fetchOrder();
      }
    });
  }

  fetchOrder(): void {
    if (!this.orderId) return;
    this.loading = true;
    this.error = '';
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.error = '';
        this.fetchTransaction();
        this.setupCountdown();
        if (order && order.orderDetails) {
          console.log('Order Details:', order.orderDetails);
          order.orderDetails.forEach((item: any) => {
            console.log('Item', item.id, 'isRefunded:', item.isRefunded, 'refundedQty:', item.refundedQty);
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load order details.';
      }
    });
  }

  fetchTransaction(): void {
    if (!this.orderId) return;
    this.orderService.getTransactionByOrderId(this.orderId).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
      },
      error: (err) => {
        this.transaction = null;
      }
    });
  }

  loadOrderDetails(): void {
    this.fetchOrder();
  }

  getTotalQuantity(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  }

  payNow(orderId: number): void {
    this.router.navigate(['/payment', orderId]);
  }

  setupCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdown = '';
    this.showPayButton = false;
    if (this.order && this.order.status === 'PENDING' && this.order.orderDate) {
      const orderPlaced = new Date(this.order.orderDate);
      const expireAt = new Date(orderPlaced.getTime() + 3 * 24 * 60 * 60 * 1000);
      this.updateCountdown(expireAt);
      this.countdownInterval = setInterval(() => {
        this.updateCountdown(expireAt);
      }, 1000);
      this.showPayButton = true;
    }
  }

  updateCountdown(expireAt: Date): void {
    const now = new Date();
    const diff = expireAt.getTime() - now.getTime();
    if (diff <= 0) {
      this.countdown = 'Expired';
      this.showPayButton = false;
      clearInterval(this.countdownInterval);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    this.countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  onPayNow(): void {
    // TODO: Implement payment logic or navigation
    alert('Pay Now clicked!');
  }

  getCountdownColorClass(): string {
    if (!this.order || this.order.status !== 'PENDING' || !this.order.orderDate) return '';
    const orderPlaced = new Date(this.order.orderDate);
    const expireAt = new Date(orderPlaced.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expireAt.getTime() - now.getTime();
    if (diff <= 0) return 'countdown-red';
    const days = diff / (1000 * 60 * 60 * 24);
    if (days > 2) return 'countdown-green';
    if (days > 1) return 'countdown-yellow';
    return 'countdown-red';
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // Helper methods for discount display
  hasDiscount(item: any): boolean {
    return item.discountPercent != null && item.discountAmount != null && item.discountAmount > 0;
  }

  getDiscountedPrice(item: any): number {
    if (this.hasDiscount(item)) {
      return item.price - item.discountAmount;
    }
    return item.price;
  }

  getItemSubtotal(item: any): number {
    return item.quantity * this.getDiscountedPrice(item);
  }


}
