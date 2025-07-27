import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../services/order.service';
import { RefundService } from '../services/refund.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-customer-order-detail',
  standalone: false,
  templateUrl: './customer-order-detail.component.html',
  styleUrl: './customer-order-detail.component.css',
})
export class CustomerOrderDetailComponent implements OnInit, OnDestroy {
  orderId: number | null = null;
  order: any = null;
  transaction: any = null;
  loading = false;
  error = '';
  countdown: string = '';
  countdownInterval: any = null;
  showPayButton: boolean = false;
  refunds: any[] = [];
  showVoucherReview = false;
  showAllItemsModal = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private refundService: RefundService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.orderId = +params['orderId'];
      if (this.orderId) {
        this.fetchOrder();
        this.fetchRefunds();
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
            console.log(
              'Item',
              item.id,
              'isRefunded:',
              item.isRefunded,
              'refundedQty:',
              item.refundedQty
            );
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load order details.';
      },
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
      },
    });
  }

  fetchRefunds(): void {
    if (!this.orderId) return;
    this.refundService.getRefundsByOrderId(this.orderId).subscribe({
      next: (refunds) => {
        this.refunds = refunds || [];
      },
      error: (err) => {
        this.refunds = [];
      },
    });
  }

  loadOrderDetails(): void {
    this.fetchOrder();
  }

  getTotalQuantity(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );
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
      const expireAt = new Date(
        orderPlaced.getTime() + 3 * 24 * 60 * 60 * 1000
      );
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
    if (!this.order || this.order.status !== 'PENDING' || !this.order.orderDate)
      return '';
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

  isItemRefundedAndAccepted(item: any): boolean {
    if (!item || !this.refunds || this.refunds.length === 0) return false;
    // Find any refund for this item with status APPROVED/ACCEPTED
    return this.refunds.some(
      (refund) =>
        (refund.status === 'APPROVED' || refund.status === 'ACCEPTED') &&
        refund.refundedItems &&
        refund.refundedItems.some(
          (refItem: any) => refItem.orderDetailId === item.id
        )
    );
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // Helper methods for discount display
  hasDiscount(item: any): boolean {
    return (
      item.discountPercent != null &&
      item.discountAmount != null &&
      item.discountAmount > 0
    );
  }

  hasAnyDiscount(): boolean {
    if (!this.order || !this.order.orderDetails) return false;
    return this.order.orderDetails.some((item: any) => this.hasDiscount(item));
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

  getTotalSubtotal(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails.reduce((sum: number, item: any) => {
      return sum + this.getItemSubtotal(item);
    }, 0);
  }

  getTotalItemsExcludingRefunds(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails.filter((item: any) => !item.isRefunded).length;
  }

  getTotalQuantityExcludingRefunds(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails
      .filter((item: any) => !item.isRefunded)
      .reduce((sum: number, item: any) => sum + item.quantity, 0);
  }

  getTotalSubtotalExcludingRefunds(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails
      .filter((item: any) => !item.isRefunded)
      .reduce((sum: number, item: any) => {
        return sum + this.getItemSubtotal(item);
      }, 0);
  }

  getTotalAmountExcludingRefunds(): number {
    if (!this.order) return 0;
    const subtotalExcludingRefunds = this.getTotalSubtotalExcludingRefunds();
    const deliveryFee = this.order.deliveryFee || 0;
    const discountAmount = this.order.discountAmount || 0;
    return subtotalExcludingRefunds + deliveryFee - discountAmount;
  }

  getReceiptSummary(): string {
    if (!this.order) return '';
    // Set up columns for perfect alignment: label left, value right
    const labelWidth = 18; // left-aligned label
    // Find the max width needed for the value column
    const values = [
      'MMK ' + (this.order.subtotal?.toLocaleString() || ''),
      'MMK ' + (this.order.deliveryFee?.toLocaleString() || ''),
      this.order.discountAmount > 0
        ? '-MMK ' + this.order.discountAmount.toLocaleString()
        : '',
      'MMK ' + (this.order.total?.toLocaleString() || ''),
    ];
    const valueWidth = Math.max(...values.map((v) => v.length));
    const padLabel = (str: string, len: number) => str.padEnd(len, ' ');
    const padValue = (str: string, len: number) => str.padStart(len, ' ');
    let lines = [
      `${padLabel('Subtotal:', labelWidth)}${padValue(values[0], valueWidth)}`,
      `${padLabel('Delivery Fee:', labelWidth)}${padValue(
        values[1],
        valueWidth
      )}`,
    ];
    if (this.order.discountAmount > 0) {
      lines.push(
        `${padLabel('Coupon:', labelWidth)}${padValue(values[2], valueWidth)}`
      );
    }
    lines.push(
      `${padLabel('Total:', labelWidth)}${padValue(values[3], valueWidth)}`
    );
    return lines.join('\n');
  }

  async downloadPDF() {
    console.log('Download PDF clicked');
    console.log('Order status:', this.order?.status);
    console.log('Can export PDF:', this.canExportPDF());
    
    if (!this.order || !this.canExportPDF()) {
      alert('PDF download is only available for shipped, delivered, or completed orders.');
      return;
    }

    try {
      const element = document.getElementById('pdf-receipt') as HTMLElement;
      if (!element) {
        console.error('PDF receipt element not found');
        alert('PDF receipt element not found. Please try refreshing the page.');
        return;
      }

      console.log('PDF element found, starting generation...');

      // Show loading state
      const exportBtn = document.querySelector('.export-btn-wrapper button') as HTMLButtonElement;
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.textContent = 'Generating PDF...';
      }

      console.log('Loading html2canvas...');
      const html2canvas = (await import('html2canvas')).default;
      console.log('Loading jsPDF...');
      const jsPDF = (await import('jspdf')).default;

      console.log('Generating canvas...');
      const canvas = await html2canvas(element, { 
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 850, // Match the HTML container width
        height: 800  // Match the HTML container height
      });

      console.log('Canvas generated, creating PDF...');

      // Calculate PDF dimensions to fit the content properly
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Use standard A4 size to ensure all content fits
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add the image to fit the page width, let height adjust
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

      console.log('PDF created, saving...');
      // Save the PDF
      pdf.save(`order-receipt-${this.order.trackingCode}.pdf`);
      console.log('PDF saved successfully!');

      // Reset button state
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `
          Export
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        `;
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again. Check console for details.');
      
      // Reset button state on error
      const exportBtn = document.querySelector('.export-btn-wrapper button') as HTMLButtonElement;
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `
          Export
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        `;
      }
    }
  }

  canExportPDF(): boolean {
    if (!this.order || !this.order.status) return false;
    const allowedStatuses = ['SHIPPED', 'DELIVERED', 'COMPLETED'];
    return allowedStatuses.includes(this.order.status.toUpperCase());
  }
}
