import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentRequest {
  orderId: number;
  paymentMethod: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  receiptImageUrl?: string;
  paymentStatus?: string;
}

export interface PaymentResponse {
  orderId: number;
  paymentMethod: string;
  paymentStatus: string;
  message: string;
  transactionId: string;
  success: boolean;
}

export interface ProductSearchParams {
  query: string;
  type: 'all' | 'productId' | 'variantId' | 'sku' | 'name' | 'category';
  category?: string;
  stockStatus?: string;
}

export interface ProductSearchResult {
  productId: number;
  variantId?: number;
  productName: string;
  variantName?: string;
  sku: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  stockQuantity: number;
  reorderPoint: number;
  totalSales: number;
  totalProfit: number;
  profitMargin: number;
  lastSoldDate?: string;
  supplierInfo?: string;
  imageUrl?: string;
  quantitySold?: number;
  totalPurchasePrice?: number;
}

export interface CategoryAnalyticsDTO {
  categoryName: string;
  totalSales: number;
  orderCount: number;
  totalProfit: number;
}

export interface LostProductAnalyticsDTO {
  productId: number;
  productName: string;
  variantId: number;
  variantName?: string;
  variantAttributes?: string;
  sku: string;
  category: string;
  imageUrl?: string;
  reductionReason: string;
  totalQuantityLost: number;
  totalPurchasePriceLost: number;
  lastReducedAt: string;
  adminName: string;
  reductionCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  baseUrl = "http://localhost:8080/api/orders";
  

  constructor(private http: HttpClient) { }

  placeOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/checkout`, orderData);
  }

  getOrderById(orderId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orderId}`);
  }

  getOrdersByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`);
  }

  getOrdersByUserAndStatus(userId: number, status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}/status/${status}`);
  }

  applyCouponToOrder(orderId: number, couponCode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${orderId}/apply-coupon`, { couponCode });
  }

  processPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/payment`, paymentRequest);
  }

  /**
   * Mark order as paid and create a pending transaction
   */
  markOrderPaidAndCreateTransaction(orderId: number, data: {
    paymentMethod: string;
    amount: number;
    proofImageUrl?: string;
    reviewerUserId?: number;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/${orderId}/pay`, data);
  }

  /**
   * Fetch transaction for an order
   */
  getTransactionByOrderId(orderId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orderId}/transaction`);
  }

  /**
   * Get all orders with transactions for admin
   */
  getOrdersWithTransactions(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }): Observable<any[]> {
    let params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/admin/with-transactions?${queryString}` : `${this.baseUrl}/admin/with-transactions`;
    
    return this.http.get<any[]>(url);
  }

  /**
   * Update order status (admin)
   */
  updateOrderStatus(orderId: number, status: string, reason?: string) {
    return this.http.post<any>(`${this.baseUrl}/${orderId}/status`, { status, reason });
  }

  /**
   * Get dashboard stats for admin
   */
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/dashboard-stats`);
  }

  /**
   * Get sales trend for dashboard (by day/week/month)
   */
  getSalesTrend(from: string, to: string, groupBy: string) {
    return this.http.get<any[]>(`${this.baseUrl}/admin/sales-trend?from=${from}&to=${to}&groupBy=${groupBy}`);
  }

  /**
   * Get daily order details for a specific date
   */
  getDailyOrderDetails(date: string) {
    return this.http.get<any[]>(`${this.baseUrl}/admin/daily-orders?date=${date}`);
  }

  /**
   * Get best seller products (limit default 10)
   */
  getBestSellerProducts(limit: number = 10, from?: string, to?: string): Observable<any[]> {
    let url = `${this.baseUrl}/admin/best-sellers?limit=${limit}`;
    if (from && to) {
      url += `&from=${from}&to=${to}`;
    }
    return this.http.get<any[]>(url);
  }

  /**
   * Get product categories for search filters
   */
  getProductCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/admin/product-categories`);
  }

  /**
   * Search products with various filters
   */
  searchProducts(searchParams: ProductSearchParams): Observable<ProductSearchResult[]> {
    let params = new URLSearchParams();
    params.append('query', searchParams.query);
    params.append('type', searchParams.type);
    if (searchParams.category) params.append('category', searchParams.category);
    if (searchParams.stockStatus) params.append('stockStatus', searchParams.stockStatus);
    
    return this.http.get<ProductSearchResult[]>(`${this.baseUrl}/admin/search-products?${params.toString()}`);
  }

  /**
   * Get product details by ID
   */
  getProductById(productId: number): Observable<ProductSearchResult> {
    return this.http.get<ProductSearchResult>(`${this.baseUrl}/admin/product/${productId}`);
  }

  /**
   * Get product sales history
   */
  getProductSalesHistory(productId: number, variantId?: number): Observable<any[]> {
    let url = `${this.baseUrl}/admin/product/${productId}/sales-history`;
    if (variantId) {
      url += `?variantId=${variantId}`;
    }
    return this.http.get<any[]>(url);
  }

  /**
   * Export product data
   */
  exportProductData(productId: number, format: 'excel' | 'csv' | 'pdf' = 'excel'): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/product/${productId}/export?format=${format}`, {
      responseType: 'blob'
    });
  }

  /**
   * Export search results
   */
  exportSearchResults(searchParams: ProductSearchParams, format: 'excel' | 'csv' | 'pdf' = 'excel'): Observable<any> {
    let params = new URLSearchParams();
    params.append('query', searchParams.query);
    params.append('type', searchParams.type);
    if (searchParams.category) params.append('category', searchParams.category);
    if (searchParams.stockStatus) params.append('stockStatus', searchParams.stockStatus);
    params.append('format', format);
    
    return this.http.get(`${this.baseUrl}/admin/export-search-results?${params.toString()}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get order status history by tracking code
   */
  getOrderStatusHistoryByTrackingCode(trackingCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/track/${trackingCode}`);
  }

  getOrderForRefund(trackingCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/refund/${trackingCode}`);
  }

  submitRefundRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/refunds`, data);
  }

  getTopCategories(from: string, to: string): Observable<CategoryAnalyticsDTO[]> {
    return this.http.get<CategoryAnalyticsDTO[]>(`${this.baseUrl}/admin/top-categories?from=${from}&to=${to}`);
  }

    getLostProductsAnalytics(from: string, to: string, reason?: string): Observable<LostProductAnalyticsDTO[]> {
      let url = `${this.baseUrl}/admin/lost-products-analytics?fromDate=${from}&toDate=${to}`;
      if (reason) {
        url += `&reason=${encodeURIComponent(reason)}`;
      }
      return this.http.get<LostProductAnalyticsDTO[]>(url);
    }

    getReductionReasons(): Observable<string[]> {
      return this.http.get<string[]>(`${this.baseUrl}/admin/reduction-reasons`);
    }
}