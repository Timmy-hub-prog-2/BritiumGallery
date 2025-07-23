package com.maven.demo.service;

import java.util.List;
import java.util.Map;

import com.maven.demo.dto.BestSellerProductDTO;
import com.maven.demo.dto.CategoryAnalyticsDTO;
import com.maven.demo.dto.CheckoutRequestDTO;
import com.maven.demo.dto.DailyOrderDetailDTO;
import com.maven.demo.dto.DashboardStatsDTO;
import com.maven.demo.dto.OrderResponseDTO;
import com.maven.demo.dto.PaymentRequestDTO;
import com.maven.demo.dto.PaymentResponseDTO;
import com.maven.demo.dto.ProductSalesHistoryDTO;
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.SalesTrendDTO;
import com.maven.demo.dto.TransactionDTO;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.OrderStatus;

public interface OrderService {
    OrderEntity placeOrder(CheckoutRequestDTO dto);
    OrderEntity applyCouponToOrder(Long orderId, String couponCode);
    OrderEntity getOrderById(Long orderId);
    OrderResponseDTO toOrderResponseDTO(OrderEntity order);
    List<OrderEntity> getOrdersByUser(Long userId);
    List<OrderEntity> getOrdersByUserAndStatus(Long userId, OrderStatus status);
    List<OrderEntity> getOrdersByStatus(OrderStatus status);
    PaymentResponseDTO processPayment(PaymentRequestDTO paymentRequest);

    // Mark order as paid and create a pending transaction
    void markOrderPaidAndCreateTransaction(Long orderId, String paymentMethod, Integer amount, String proofImageUrl, Long reviewerUserId, String notes);

    // Fetch transaction for an order
    TransactionDTO getTransactionByOrderId(Long orderId);

    // Get all orders with transactions for admin
    List<OrderEntity> getOrdersWithTransactions(String status, String startDate, String endDate, String searchTerm);

    // Update order status and save status history
    OrderEntity updateOrderStatus(Long orderId, String status, String reason);

    DashboardStatsDTO getDashboardStats();

    List<SalesTrendDTO> getSalesTrend(java.time.LocalDate from, java.time.LocalDate to, String groupBy);

    // Get daily order details for a specific date
    List<DailyOrderDetailDTO> getDailyOrderDetails(java.time.LocalDate date);

    // Get best seller products with profit analysis
    List<BestSellerProductDTO> getBestSellerProducts(int limit);
    List<BestSellerProductDTO> getBestSellerProductsByDateRange(java.time.LocalDate from, java.time.LocalDate to, int limit);

    // Product Search Methods
    List<String> getProductCategories();
    List<ProductSearchResultDTO> searchProducts(String query, String type, String category, String stockStatus);
    ProductSearchResultDTO getProductById(Long productId);
    List<ProductSalesHistoryDTO> getProductSalesHistory(Long productId, Long variantId);
    byte[] exportProductData(Long productId, String format);
    byte[] exportSearchResults(String query, String type, String category, String stockStatus, String format);
    
    // Update estimated delivery time for existing orders
    void updateEstimatedDeliveryTimeForOrder(Long orderId);

    List<CategoryAnalyticsDTO> getTopCategories(java.time.LocalDate from, java.time.LocalDate to);

    DashboardStatsDTO getProfitLoss(String from, String to, Long categoryId);

    Map<String, Object> getDiscountAnalytics(String from, String to, Long categoryId);
} 