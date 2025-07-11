import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface RefundRequestDTO {
  orderId: number;
  type: 'FULL' | 'PARTIAL';
  reason?: string;
  items?: RefundItemDTO[];
}

export interface RefundItemDTO {
  orderDetailId: number;
  quantity: number;
  reason: string;
}

export interface PendingRefundDTO {
  id: number;
  amount: number;
  reason: string;
  requestedAt: string;
  orderId: number;
  trackingCode: string;
  orderStatus: string;
  deliveredAt?: string;
  customerName: string;
  type: 'FULL' | 'PARTIAL';
  refundQuantity?: number;
  orderDetailId?: number;
  refundedItems?: any[];
  status: string;
  proofImageUrl?: string;
  reviewedBy?: string;
  adminNote?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RefundService {
  baseUrl = "http://localhost:8080/api";

  constructor(private http: HttpClient) { }

  /**
   * Get order details for refund by tracking code
   */
  getOrderForRefund(trackingCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/refund/${trackingCode}`);
  }

  /**
   * Submit a refund request with proof files
   */
  submitRefundRequest(formData: FormData): Observable<any> {
    
    return this.http.post(`${this.baseUrl}/refunds/submit`, formData);
  }

  /**
   * Get refund request status
   */
  getRefundStatus(refundId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${refundId}/status`);
  }

  /**
   * Get all refund requests for a user
   */
  getUserRefundRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user`);
  }

  /**
   * Cancel a refund request (if still in REQUESTED state)
   */
  cancelRefundRequest(refundId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${refundId}/cancel`, {});
  }

  /**
   * Get all pending refund requests (admin)
   */
  getPendingRefundRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/refunds/pending`);
  }

  /**
   * Get refund request details by ID (admin)
   */
  getRefundRequestById(refundId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/refunds/${refundId}`);
  }

  /**
   * Get all refund requests for a given order ID (admin)
   */
  getRefundsByOrderId(orderId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/refunds/order/${orderId}`);
  }

  /**
   * Accept a refund request (admin)
   */
  acceptRefund(refundId: number, reviewedBy: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/refunds/accept/${refundId}`, { reviewedBy });
  }

  /**
   * Reject a refund request (admin)
   */
  rejectRefund(refundId: number, reviewedBy: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/refunds/reject/${refundId}`, { reviewedBy, reason });
  }

  /**
   * Get all refund requests (admin), filter by status on frontend
   */
  getRefundRequestsByStatus(status: string | null): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/refunds`);
  }

  /**
   * Get all refund requests for a given user ID (customer)
   */
  getRefundsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/refunds/user/${userId}`);
  }
}
