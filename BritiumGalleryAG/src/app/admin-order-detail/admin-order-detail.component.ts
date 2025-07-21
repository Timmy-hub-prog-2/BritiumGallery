import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-customer-order-detail',
  standalone: false,
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.css'
})
export class AdminOrderDetailComponent implements OnInit {
  orderId: number | null = null;
  order: any = null;
  transaction: any = null;
  loading = false;
  error = '';
  showReceiptModal = false;
  showAllItemsModal = false;
  showRejectModal = false;
  rejectReason = '';
  selectedRejectReason = '';
  showCustomReason = false;
  nextStatus = 'SHIPPED';
  showStatusModal = false;
  statusComment = '';
  showStatusForm = false;

  // Predefined rejection reasons
  readonly predefinedRejectReasons = [
    'Out of stock',
    'Invalid delivery address',
    'Payment verification failed',
    'Item no longer available',
    'Delivery area not supported',
    'Order exceeds delivery limits',
    'Suspicious order activity',
    'Customer requested cancellation',
    'Other'
  ];

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

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
        this.setNextStatus();
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

  isPaid(): boolean {
    return this.order && this.order.status && this.order.status.toUpperCase() === 'PAID';
  }
  isAccepted(): boolean {
    return this.order && this.order.status && this.order.status.toUpperCase() === 'ACCEPTED';
  }

  acceptOrder() {
    this.updateOrderStatus('ACCEPTED');
  }

  openRejectModal() {
    this.showRejectModal = true;
    this.selectedRejectReason = '';
    this.rejectReason = '';
    this.showCustomReason = false;
  }

  onRejectReasonChange() {
    if (this.selectedRejectReason === 'Other') {
      this.showCustomReason = true;
      this.rejectReason = '';
    } else {
      this.showCustomReason = false;
      this.rejectReason = this.selectedRejectReason;
    }
  }

  rejectOrder() {
    const finalReason = this.showCustomReason ? this.rejectReason : this.selectedRejectReason;
    
    if (!finalReason.trim()) {
      alert('Please select or enter a reason for rejection.');
      return;
    }
    
    this.updateOrderStatus('CANCELLED', finalReason);
    this.showRejectModal = false;
    this.rejectReason = '';
    this.selectedRejectReason = '';
    this.showCustomReason = false;
  }

  updateOrderStatus(newStatus: string, reason?: string) {
    this.orderService.updateOrderStatus(this.order.id, newStatus, reason).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.fetchTransaction();
        // Optionally show a success message
      },
      error: (err) => {
        alert('Failed to update order status.');
      }
    });
  }

  canChangeStatus(): boolean {
    return ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(this.order?.status);
  }

  setNextStatus() {
    if (this.order.status === 'ACCEPTED') this.nextStatus = 'SHIPPED';
    else if (this.order.status === 'SHIPPED') this.nextStatus = 'DELIVERED';
    else if (this.order.status === 'DELIVERED') this.nextStatus = 'COMPLETED';
    else this.nextStatus = '';
  }

  submitStatusUpdate() {
    if (!this.nextStatus) return;
    this.updateOrderStatus(this.nextStatus);
    this.showStatusForm = false;
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
