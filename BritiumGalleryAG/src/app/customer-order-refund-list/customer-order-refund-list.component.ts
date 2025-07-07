import { Component, OnInit } from '@angular/core';
import { RefundService } from '../services/refund.service';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-admin-order-refund-list',
  standalone: false,
  templateUrl: './customer-order-refund-list.component.html',
  styleUrl: './customer-order-refund-list.component.css'
})
export class CustomerComponentOrderRefundListComponent implements OnInit {
  pendingRefunds: any[] = [];
  groupedRefunds: any[] = [];
  filteredRefundOrders: any[] = [];
  loadingRefunds: boolean = false;
  refundError: string = '';
  searchOrderId: string = '';
  startDate: string = '';
  endDate: string = '';
  selectedStatus: string = 'ALL';
  statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  constructor(private refundService: RefundService, private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.loadRefundsByUser();
  }

  loadRefundsByUser(): void {
    this.loadingRefunds = true;
    this.refundError = '';
    const user = this.userService.userValue;
    if (!user || !user.id) {
      this.refundError = 'User not logged in.';
      this.loadingRefunds = false;
      return;
    }
    this.refundService.getRefundsByUserId(user.id).subscribe({
      next: (refunds: any[]) => {
        this.pendingRefunds = Array.isArray(refunds) ? refunds : [];
        this.groupRefundsByOrder();
        this.applyOrderSearch();
        this.loadingRefunds = false;
        this.refundError = '';
      },
      error: (err: any) => {
        this.refundError = 'Failed to load refunds';
        this.loadingRefunds = false;
        console.error('Refunds error:', err);
      }
    });
  }

  groupRefundsByOrder(): void {
    const grouped: {[key: string]: any[]} = {};
    this.pendingRefunds.forEach(refund => {
      if (!grouped[refund.trackingCode]) grouped[refund.trackingCode] = [];
      grouped[refund.trackingCode].push(refund);
    });
    this.groupedRefunds = Object.keys(grouped).map(trackingCode => {
      const summary = { ...grouped[trackingCode][0] };
      summary.allRefunds = grouped[trackingCode];
      summary.latestRequestedAt = grouped[trackingCode].reduce((latest, r) => {
        return (!latest || new Date(r.requestedAt) > new Date(latest)) ? r.requestedAt : latest;
      }, null);
      return summary;
    });
    this.groupedRefunds.sort((a, b) => new Date(b.latestRequestedAt).getTime() - new Date(a.latestRequestedAt).getTime());
  }

  applyOrderSearch(): void {
    let filtered = this.groupedRefunds;
    if (this.searchOrderId && this.searchOrderId.trim() !== '') {
      filtered = filtered.filter((orderGroup: any) =>
        orderGroup.trackingCode && orderGroup.trackingCode.toString().includes(this.searchOrderId.trim())
      );
    }

    if (this.selectedStatus && this.selectedStatus !== 'ALL') {
      filtered = filtered.filter((orderGroup: any) =>
        orderGroup.allRefunds.some((r: any) => r.status === this.selectedStatus)
      );
    }

    if (this.startDate) {
      filtered = filtered.filter((r: any) => r.latestRequestedAt && new Date(r.latestRequestedAt) >= new Date(this.startDate));
    }
    if (this.endDate) {
      filtered = filtered.filter((r: any) => r.latestRequestedAt && new Date(r.latestRequestedAt) <= new Date(this.endDate));
    }
    this.filteredRefundOrders = filtered;
  }

  onOrderSearch(): void {
    this.applyOrderSearch();
  }

  onFilter(): void {
    this.loadRefundsByUser();
  }

  viewRefundDetails(refund: any): void {
    this.router.navigate(['/customer-order-refund', refund.orderId]);
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

  clearFilters(): void {
    this.searchOrderId = '';
    this.selectedStatus = 'ALL';
    this.startDate = '';
    this.endDate = '';
    this.applyOrderSearch();
  }
}
