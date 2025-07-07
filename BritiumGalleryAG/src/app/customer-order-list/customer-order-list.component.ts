import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-order-list',
  standalone: false,
  templateUrl: './customer-order-list.component.html',
  styleUrl: './customer-order-list.component.css'
})
export class CustomerOrderListComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  filteredOrders: any[] = [];
  currentUser: User | null = null;
  selectedStatus: string = 'ALL';
  loading: boolean = false;
  error: string = '';
  countdowns: { [orderId: number]: string } = {};
  private timerSub: Subscription | null = null;

  statusOptions = [
    { value: 'ALL', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' }
  ];

  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.startCountdownTimer();
  }

  ngOnDestroy(): void {
    if (this.timerSub) this.timerSub.unsubscribe();
  }

  loadCurrentUser(): void {
    this.currentUser = this.userService.userValue;
    if (this.currentUser) {
      this.loadOrders();
    } else {
      this.error = 'Please login to view your orders';
    }
  }

  loadOrders(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    this.error = '';

    if (this.selectedStatus === 'ALL') {
      this.orderService.getOrdersByUser(this.currentUser.id).subscribe({
        next: (orders: any[]) => {
          this.orders = orders;
          this.filteredOrders = orders;
          this.loading = false;
          this.updateCountdowns();
        },
        error: (err: any) => {
          this.error = 'Failed to load orders';
          this.loading = false;
        }
      });
    } else {
      this.orderService.getOrdersByUserAndStatus(this.currentUser.id, this.selectedStatus).subscribe({
        next: (orders: any[]) => {
          this.orders = orders;
          this.filteredOrders = orders;
          this.loading = false;
          this.updateCountdowns();
        },
        error: (err: any) => {
          this.error = 'Failed to load orders';
          this.loading = false;
        }
      });
    }
  }

  onStatusChange(): void {
    this.loadOrders();
  }

  payNow(orderId: number): void {
    this.router.navigate(['/payment', orderId]);
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/customer-order-detail', orderId]);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'PAID': return 'badge-success';
      case 'SHIPPED': return 'badge-info';
      case 'DELIVERED': return 'badge-primary';
      case 'CANCELLED': return 'badge-danger';
      case 'REFUNDED': return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  getTotalItems(order: any): number {
    return order.orderDetails ? order.orderDetails.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  startCountdownTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      this.updateCountdowns();
    });
  }

  updateCountdowns(): void {
    for (const order of this.filteredOrders) {
      if (order.status === 'PENDING') {
        this.countdowns[order.id] = this.getCountdown(order);
      }
    }
  }

  getCountdown(order: any): string {
    if (!order.orderDate) return '';
    const orderDate = new Date(order.orderDate);
    const expireDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expireDate.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s left to pay`;
  }

  getCountdownBgClass(order: any): string {
    if (!order.orderDate) return '';
    const orderDate = new Date(order.orderDate);
    const expireDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expireDate.getTime() - now.getTime();
    if (diff <= 0) return '';
    const days = diff / (1000 * 60 * 60 * 24);
    if (days > 2) return 'countdown-green';
    if (days > 1) return 'countdown-yellow';
    return 'countdown-red';
  }

  isCountdownActive(order: any): boolean {
    if (!order.orderDate) return false;
    const orderDate = new Date(order.orderDate);
    const expireDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return expireDate.getTime() - now.getTime() > 0;
  }

  goToTrackOrder() {
    this.router.navigate(['/order-tracking']);
  }

  goToRefundOrder() {
    this.router.navigate(['/order-refund']);
  }


}
