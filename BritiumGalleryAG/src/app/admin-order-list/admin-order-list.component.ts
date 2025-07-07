import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';
import { RefundService } from '../services/refund.service';

@Component({
  selector: 'app-admin-order-list',
  standalone: false,
  templateUrl: './admin-order-list.component.html',
  styleUrl: './admin-order-list.component.css'
})
export class AdminOrderListComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  currentUser: User | null = null;
  selectedStatus: string = 'ALL';
  startDate: string = '';
  endDate: string = '';
  searchTerm: string = '';
  loading: boolean = false;
  error: string = '';
  pendingRefunds: any[] = [];
  loadingRefunds: boolean = false;
  refundError: string = '';
  showRefundDetail: boolean = false;
  selectedRefund: any = null;
  searchOrderId: string = '';
  groupedRefunds: any[] = [];
  filteredRefundOrders: any[] = [];

  statusOptions = [
    { value: 'ALL', label: 'All Orders' },
    { value: 'PAID', label: 'Pending' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value:'COMPLETED',label:'Completed'},
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' }
  ];

  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private router: Router,
    private refundService: RefundService
  ) {
    this.pendingRefunds = [];
    this.groupedRefunds = [];
    this.filteredOrders = [];
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadOrders();
    this.loadPendingRefunds();
  }

  loadCurrentUser(): void {
    this.currentUser = this.userService.userValue;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';

    const filters: any = {};
    if (this.selectedStatus !== 'ALL') {
      filters.status = this.selectedStatus;
    }
    if (this.startDate) {
      filters.startDate = this.startDate;
    }
    if (this.endDate) {
      filters.endDate = this.endDate;
    }
    if (this.searchTerm) {
      filters.searchTerm = this.searchTerm;
    }

    this.orderService.getOrdersWithTransactions(filters).subscribe({
      next: (orders: any[]) => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.loading = false;
        this.error = '';
      },
      error: (err: any) => {
        this.error = 'Failed to load orders';
        this.loading = false;
      }
    });
  }

  loadPendingRefunds(): void {
    this.loadingRefunds = true;
    this.refundError = '';
    this.refundService.getPendingRefundRequests().subscribe({
      next: (refunds: any[]) => {
        this.pendingRefunds = Array.isArray(refunds) ? refunds : [];
        this.groupRefundsByOrder();
        this.applyOrderSearch();
        this.loadingRefunds = false;
        this.refundError = '';
      },
      error: (err: any) => {
        this.refundError = 'Failed to load pending refunds';
        this.loadingRefunds = false;
        console.error('Pending refunds error:', err);
      }
    });
  }

  groupRefundsByOrder(): void {
    const grouped: {[key: string]: any[]} = {};
    this.pendingRefunds.forEach(refund => {
      if (!grouped[refund.orderId]) grouped[refund.orderId] = [];
      grouped[refund.orderId].push(refund);
    });
    this.groupedRefunds = Object.keys(grouped).map(orderId => {
      // Use the first refund as the summary, but attach all refunds for details
      const summary = { ...grouped[orderId][0] };
      summary.allRefunds = grouped[orderId];
      return summary;
    });
  }

  applyOrderSearch(): void {
    if (this.searchOrderId && this.searchOrderId.trim() !== '') {
      this.filteredRefundOrders = this.groupedRefunds.filter(r => r.orderId && r.orderId.toString().includes(this.searchOrderId.trim()));
    } else {
      this.filteredRefundOrders = this.groupedRefunds;
    }
  }

  onOrderSearch(): void {
    this.applyOrderSearch();
  }

  onStatusChange(): void {
    this.loadOrders();
  }

  onDateChange(): void {
    this.loadOrders();
  }

  onSearch(): void {
    this.loadOrders();
  }

  clearFilters(): void {
    this.selectedStatus = 'ALL';
    this.startDate = '';
    this.endDate = '';
    this.searchTerm = '';
    this.loadOrders();
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/admin-order-detail', orderId]);
  }

  getTotalItems(order: any): number {
    if (!order.orderDetails) return 0;
    return order.orderDetails.reduce((sum: number, item: any) => sum + item.quantity, 0);
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

  getDisplayStatus(order: any): string {
    if (order.status === 'PAID') {
      return 'PENDING';
    }
    return order.status;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'PAID': return 'badge-success';
      case 'PENDING_VERIFICATION': return 'badge-info';
      case 'SHIPPED': return 'badge-primary';
      case 'DELIVERED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      case 'REFUNDED': return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  getTransactionStatus(order: any): string {
    // This would need to be implemented based on your transaction data structure
    return 'Transaction Found';
  }

  
}
