import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RefundService } from '../services/refund.service';
import { UserService } from '../services/user.service';

interface RefundedItem {
  productName: string;
  quantity: number;
  variant?: {
    imageUrl?: string;
    sku?: string;
    attributes?: { [key: string]: string };
  };
}
interface Refund {
  id: number;
  orderId: number;
  trackingCode: string;
  customerName: string;
  status: string;
  type: string;
  requestedAt: string;
  deliveredAt?: string;
  refundedItems: RefundedItem[];
  amount: number;
  reason: string;
  proofImageUrl?: string;
  reviewedBy?: string;
  adminNote?: string;
}

@Component({
  selector: 'app-admin-order-refund',
  standalone: false,
  templateUrl: './admin-order-refund.component.html',
  styleUrl: './admin-order-refund.component.css'
})
export class AdminOrderRefundComponent implements OnInit {
  orderId!: number;
  refunds: Refund[] = [];
  loading = false;
  error = '';
  actionLoading: { [id: number]: boolean } = {};
  actionError: { [id: number]: string } = {};

  // Modal state
  showRejectModal = false;
  selectedRefundId: number | null = null;
  rejectionReason = '';

  // Proof image modal state
  showProofModal = false;
  proofModalImageUrl: string | null = null;

  // Expanded rows state
  expandedRows: boolean[] = [];

  constructor(private route: ActivatedRoute, private refundService: RefundService, private userService: UserService) {}

  ngOnInit(): void {
    this.orderId = +this.route.snapshot.paramMap.get('refundId')!;
    if (this.orderId) {
      this.loading = true;
      this.refundService.getRefundsByOrderId(this.orderId).subscribe({
        next: (data) => {
          this.refunds = data;
          this.loading = false;
          this.expandedRows = new Array(this.refunds.length).fill(false);
        },
        error: (err) => {
          this.error = 'Failed to load refund details';
          this.loading = false;
        }
      });
    }
  }

  acceptRefund(refundId: number): void {
    this.actionLoading[refundId] = true;
    this.actionError[refundId] = '';
    const user = this.userService.userValue;
    const reviewedBy = user ? user.id : null;
    if (reviewedBy === null) {
      this.actionLoading[refundId] = false;
      this.actionError[refundId] = 'No admin user found in local storage.';
      return;
    }
    this.refundService.acceptRefund(refundId, reviewedBy).subscribe({
      next: () => {
        this.actionLoading[refundId] = false;
        // Refresh the list or update status
        this.refundService.getRefundsByOrderId(this.orderId).subscribe({
          next: (data) => {
            this.refunds = data;
            this.expandedRows = new Array(this.refunds.length).fill(false);
          },
          error: () => {
            this.error = 'Failed to refresh refund details';
          }
        });
      },
      error: (err) => {
        this.actionLoading[refundId] = false;
        this.actionError[refundId] = err?.error?.message || 'Failed to accept refund';
      }
    });
  }

  openRejectModal(refund: Refund) {
    if (refund.status !== 'REQUESTED') {
      this.actionError[refund.id] = 'Cannot reject a refund that is already processed.';
      return;
    }
    this.selectedRefundId = refund.id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedRefundId = null;
    this.rejectionReason = '';
  }

  toggleExpanded(index: number) {
    this.expandedRows[index] = !this.expandedRows[index]
  }

  confirmReject() {
    if (this.selectedRefundId && this.rejectionReason) {
      this.rejectRefund(this.selectedRefundId, this.rejectionReason);
      this.showRejectModal = false;
    }
  }

  rejectRefund(refundId: number, reason?: string) {
    this.actionLoading[refundId] = true;
    this.actionError[refundId] = '';
    const user = this.userService.userValue;
    const reviewedBy = user ? user.id : null;
    if (reviewedBy === null) {
      this.actionLoading[refundId] = false;
      this.actionError[refundId] = 'No admin user found in local storage.';
      return;
    }
    this.refundService.rejectRefund(refundId, reviewedBy, reason || '').subscribe({
      next: () => {
        this.actionLoading[refundId] = false;
        this.refundService.getRefundsByOrderId(this.orderId).subscribe({
          next: (data) => {
            this.refunds = data;
            this.expandedRows = new Array(this.refunds.length).fill(false);
          },
          error: () => {
            this.error = 'Failed to refresh refund details';
          }
        });
      },
      error: (err) => {
        this.actionLoading[refundId] = false;
        this.actionError[refundId] = err?.error?.message || 'Failed to reject refund';
      }
    });
  }

  get selectedRefundIndex(): number {
    return this.selectedRefundId != null ? this.selectedRefundId : -1;
  }

  // Proof image modal logic
  openProofModal(imageUrl: string) {
    this.proofModalImageUrl = imageUrl;
    this.showProofModal = true;
  }

  closeProofModal() {
    this.showProofModal = false;
    this.proofModalImageUrl = null;
  }
}
