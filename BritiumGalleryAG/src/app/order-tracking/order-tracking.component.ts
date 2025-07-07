import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-tracking',
  standalone: false,
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.css'
})
export class OrderTrackingComponent {
  trackingForm: FormGroup;
  loading = false;
  error: string | null = null;
  result: any = null;
  statusSteps = ['PENDING', 'PAID', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

  constructor(private fb: FormBuilder, private orderService: OrderService) {
    this.trackingForm = this.fb.group({
      trackingCode: ['', Validators.required]
    });
  }

  search() {
    this.error = null;
    this.result = null;
    if (this.trackingForm.invalid) return;
    this.loading = true;
    const code = this.trackingForm.value.trackingCode.trim();
    this.orderService.getOrderStatusHistoryByTrackingCode(code).subscribe({
      next: (res) => {
        // Transform the response to match the expected structure
        this.result = {
          ...res,
          currentStatus: res.history && res.history.length > 0 ? res.history[res.history.length - 1].status.toLowerCase() : 'unknown',
          orderDate: res.history && res.history.length > 0 ? res.history[0].timestamp : new Date(),
          estimatedDelivery: this.calculateEstimatedDelivery(res.history)
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Order not found or server error.';
        this.loading = false;
      }
    });
  }

  clearSearch() {
    this.trackingForm.patchValue({ trackingCode: '' });
  }

  setExample(code: string) {
    this.trackingForm.patchValue({ trackingCode: code });
  }

  clearError() {
    this.error = null;
    this.result = null;
  }

  getCurrentStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'status-delivered';
      case 'shipped': return 'status-shipped';
      case 'paid': return 'status-paid';
      case 'accepted': return 'status-accepted';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      default: return 'status-unknown';
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'paid': return 'Paid';
      case 'accepted': return 'Accepted';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  }

  getStatusDescription(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'Your order has been successfully delivered';
      case 'shipped': return 'Your order has been shipped from our warehouse';
      case 'paid': return 'Payment received, order confirmed';
      case 'accepted': return 'Order accepted and being processed';
      case 'pending': return 'Your order is pending confirmation';
      case 'completed': return 'Order completed successfully';
      default: return 'Status information unavailable';
    }
  }

  getProgressPercentage(currentStatus: string): number {
    const stepOrder = this.statusSteps;
    const currentIndex = stepOrder.indexOf(currentStatus?.toUpperCase());
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / stepOrder.length) * 100);
  }

  isStepCompleted(step: string, currentStatus: string): boolean {
    const stepOrder = this.statusSteps;
    const currentIndex = stepOrder.indexOf(currentStatus?.toUpperCase());
    const stepIndex = stepOrder.indexOf(step);
    return stepIndex < currentIndex;
  }

  isStepActive(step: string, currentStatus: string): boolean {
  return step.toUpperCase() === currentStatus?.toUpperCase();
}

  getTimelineItemClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'timeline-delivered';
      case 'shipped': return 'timeline-shipped';
      case 'paid': return 'timeline-paid';
      case 'accepted': return 'timeline-accepted';
      case 'pending': return 'timeline-pending';
      case 'completed': return 'timeline-completed';
      default: return 'timeline-unknown';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'status-badge-delivered';
      case 'shipped': return 'status-badge-shipped';
      case 'paid': return 'status-badge-paid';
      case 'accepted': return 'status-badge-accepted';
      case 'pending': return 'status-badge-pending';
      case 'completed': return 'status-badge-completed';
      default: return 'status-badge-unknown';
    }
  }

  getRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }

  shareTracking() {
    if (navigator.share && this.result) {
      navigator.share({
        title: 'Order Tracking',
        text: `Track my order: ${this.result.trackingCode}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      const text = `Track my order: ${this.result.trackingCode}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('Tracking information copied to clipboard!');
      });
    }
  }

  printTracking() {
    window.print();
  }

  reportIssue() {
    alert('Please contact customer service at 1-800-TRACK-ME or support@company.com');
  }

  private calculateEstimatedDelivery(history: any[]): Date {
    if (!history || history.length === 0) {
      const estimated = new Date();
      estimated.setDate(estimated.getDate() + 7); // Default 7 days
      return estimated;
    }
    
    const lastUpdate = new Date(history[history.length - 1].timestamp);
    const estimated = new Date(lastUpdate);
    estimated.setDate(estimated.getDate() + 3); // Add 3 days from last update
    return estimated;
  }


}
