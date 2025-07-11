package com.maven.demo.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.maven.demo.dto.BestSellerProductDTO;
import com.maven.demo.dto.CheckoutRequestDTO;
import com.maven.demo.dto.DailyOrderDetailDTO;
import com.maven.demo.dto.DashboardStatsDTO;
import com.maven.demo.dto.OrderRefundDTO;
import com.maven.demo.dto.OrderResponseDTO;
import com.maven.demo.dto.PaymentRequestDTO;
import com.maven.demo.dto.PaymentResponseDTO;
import com.maven.demo.dto.ProductSalesHistoryDTO;
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.SalesTrendDTO;
import com.maven.demo.entity.OrderDetailEntity;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.OrderStatus;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.SaleFifoMappingEntity;
import com.maven.demo.entity.TransactionEntity;
import com.maven.demo.entity.TransactionStatus;
import com.maven.demo.repository.OrderRepository;
import com.maven.demo.repository.OrderStatusHistoryRepository;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.repository.RefundRequestRepository;
import com.maven.demo.repository.SaleFifoMappingRepository;
import com.maven.demo.repository.TransactionRepository;
import com.maven.demo.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private SaleFifoMappingRepository saleFifoMappingRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private RefundRequestRepository refundRequestRepository;

    @PostMapping("/checkout")
    public ResponseEntity<OrderEntity> checkout(@RequestBody CheckoutRequestDTO dto) {
        OrderEntity order = orderService.placeOrder(dto);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderId}/apply-coupon")
    public ResponseEntity<OrderEntity> applyCouponToOrder(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
        String couponCode = body.get("couponCode");
        OrderEntity updatedOrder = orderService.applyCouponToOrder(orderId, couponCode);
        return ResponseEntity.ok(updatedOrder);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long orderId) {
        OrderEntity order = orderService.getOrderById(orderId);
        OrderResponseDTO dto = orderService.toOrderResponseDTO(order);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByUser(@PathVariable Long userId) {
        List<OrderEntity> orders = orderService.getOrdersByUser(userId);
        List<OrderResponseDTO> orderDTOs = orders.stream()
            .map(orderService::toOrderResponseDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(orderDTOs);
    }

    @GetMapping("/user/{userId}/status/{status}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByUserAndStatus(
            @PathVariable Long userId, 
            @PathVariable String status) {
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            List<OrderEntity> orders = orderService.getOrdersByUserAndStatus(userId, orderStatus);
            List<OrderResponseDTO> orderDTOs = orders.stream()
                .map(orderService::toOrderResponseDTO)
                .collect(Collectors.toList());
            return ResponseEntity.ok(orderDTOs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByStatus(@PathVariable String status) {
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            List<OrderEntity> orders = orderService.getOrdersByStatus(orderStatus);
            List<OrderResponseDTO> orderDTOs = orders.stream()
                .map(orderService::toOrderResponseDTO)
                .collect(Collectors.toList());
            return ResponseEntity.ok(orderDTOs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByStatus(@PathVariable OrderStatus status) {
        List<OrderEntity> orders = orderService.getOrdersByStatus(status);
        List<OrderResponseDTO> orderDTOs = orders.stream()
            .map(orderService::toOrderResponseDTO)
            .toList();
        return ResponseEntity.ok(orderDTOs);
    }

    @PostMapping("/payment")
    public ResponseEntity<PaymentResponseDTO> processPayment(@RequestBody PaymentRequestDTO paymentRequest) {
        PaymentResponseDTO response = orderService.processPayment(paymentRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/pay")
    public ResponseEntity<?> markOrderPaidAndCreateTransaction(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> body) {
        String paymentMethod = (String) body.get("paymentMethod");
        Integer amount = body.get("amount") != null ? ((Number) body.get("amount")).intValue() : null;
        String proofImageUrl = (String) body.get("proofImageUrl");
        Long reviewerUserId = body.get("reviewerUserId") != null ? Long.valueOf(body.get("reviewerUserId").toString()) : null;
        String notes = (String) body.get("notes");
        orderService.markOrderPaidAndCreateTransaction(orderId, paymentMethod, amount, proofImageUrl, reviewerUserId, notes);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Order marked as paid and transaction created."
        ));
    }

    @GetMapping("/{orderId}/transaction")
    public ResponseEntity<?> getTransactionByOrderId(@PathVariable Long orderId) {
        var transaction = orderService.getTransactionByOrderId(orderId);
        if (transaction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(transaction);
    }

    @GetMapping("/admin/with-transactions")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersWithTransactions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String searchTerm) {
        List<OrderEntity> orders = orderService.getOrdersWithTransactions(status, startDate, endDate, searchTerm);
        List<OrderResponseDTO> orderDTOs = orders.stream()
            .map(orderService::toOrderResponseDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(orderDTOs);
    }

    @PostMapping("/{orderId}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
        @PathVariable Long orderId,
        @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String reason = body.get("reason");
        OrderEntity order = orderService.updateOrderStatus(orderId, status, reason);
        OrderResponseDTO dto = orderService.toOrderResponseDTO(order);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/admin/dashboard-stats")
    public DashboardStatsDTO getDashboardStats() {
        return orderService.getDashboardStats();
    }

    @GetMapping("/admin/sales-trend")
    public java.util.List<SalesTrendDTO> getSalesTrend(
        @RequestParam String from,
        @RequestParam String to,
        @RequestParam(required = false, defaultValue = "day") String groupBy) {
        java.time.LocalDate fromDate = java.time.LocalDate.parse(from);
        java.time.LocalDate toDate = java.time.LocalDate.parse(to);
        return orderService.getSalesTrend(fromDate, toDate, groupBy);
    }

    @GetMapping("/admin/daily-orders")
    public java.util.List<DailyOrderDetailDTO> getDailyOrderDetails(
        @RequestParam String date) {
        java.time.LocalDate orderDate = java.time.LocalDate.parse(date);
        return orderService.getDailyOrderDetails(orderDate);
    }

    @GetMapping("/admin/best-sellers")
    public java.util.List<BestSellerProductDTO> getBestSellerProducts(
        @RequestParam(required = false, defaultValue = "10") int limit) {
        return orderService.getBestSellerProducts(limit);
    }

    // Product Search Endpoints
    @GetMapping("/admin/product-categories")
    public ResponseEntity<List<String>> getProductCategories() {
        List<String> categories = orderService.getProductCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/admin/search-products")
    public ResponseEntity<List<ProductSearchResultDTO>> searchProducts(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String stockStatus) {
        List<ProductSearchResultDTO> results = orderService.searchProducts(query, type, category, stockStatus);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/admin/product/{productId}")
    public ResponseEntity<ProductSearchResultDTO> getProductById(@PathVariable Long productId) {
        ProductSearchResultDTO product = orderService.getProductById(productId);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }

    @GetMapping("/admin/product/{productId}/sales-history")
    public ResponseEntity<List<ProductSalesHistoryDTO>> getProductSalesHistory(
            @PathVariable Long productId,
            @RequestParam(required = false) Long variantId) {
        List<ProductSalesHistoryDTO> history = orderService.getProductSalesHistory(productId, variantId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/admin/product/{productId}/export")
    public ResponseEntity<byte[]> exportProductData(
            @PathVariable Long productId,
            @RequestParam(required = false, defaultValue = "excel") String format) {
        byte[] data = orderService.exportProductData(productId, format);
        String filename = "product_" + productId + "." + format;
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(data);
    }

    @GetMapping("/admin/export-search-results")
    public ResponseEntity<byte[]> exportSearchResults(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false, defaultValue = "excel") String format) {
        byte[] data = orderService.exportSearchResults(query, type, category, stockStatus, format);
        String filename = "product_search_results." + format;
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(data);
    }

    // Test endpoint for debugging sales data
    @GetMapping("/admin/test-sales-data")
    public ResponseEntity<Map<String, Object>> testSalesData() {
        Map<String, Object> result = new HashMap<>();
        
        // Get all variants
        List<ProductVariantEntity> variants = productVariantRepository.findAll();
        result.put("totalVariants", variants.size());
        
        // Get all order details
        List<OrderDetailEntity> allOrderDetails = orderRepository.findAllOrderDetails();
        result.put("totalOrderDetails", allOrderDetails.size());
        
        // Get all transactions
        List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
        result.put("totalSuccessfulTransactions", transactions.size());
        
        // Sample data for first few variants
        List<Map<String, Object>> sampleData = new ArrayList<>();
        for (int i = 0; i < Math.min(5, variants.size()); i++) {
            ProductVariantEntity variant = variants.get(i);
            Map<String, Object> variantData = new HashMap<>();
            variantData.put("variantId", variant.getId());
            variantData.put("productName", variant.getProduct() != null ? variant.getProduct().getName() : "Unknown");
            variantData.put("sku", variant.getSku());
            
            // Get order details for this variant
            List<OrderDetailEntity> orderDetails = orderRepository.findOrderDetailsByVariant(variant.getId());
            variantData.put("orderDetailsCount", orderDetails.size());
            
            // Calculate sales
            int totalSales = 0;
            int totalProfit = 0;
            for (OrderDetailEntity detail : orderDetails) {
                if (detail.getOrder() != null && 
                    (detail.getOrder().getStatus() == OrderStatus.COMPLETED ||
                     detail.getOrder().getStatus() == OrderStatus.DELIVERED ||
                     detail.getOrder().getStatus() == OrderStatus.PAID ||
                     detail.getOrder().getStatus() == OrderStatus.ACCEPTED)) {
                    int sales = detail.getQuantity() * detail.getPrice();
                    totalSales += sales;
                    
                    List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                    int cost = 0;
                    for (SaleFifoMappingEntity mapping : mappings) {
                        cost += mapping.getQuantity() * mapping.getUnitCost();
                    }
                    totalProfit += sales - cost;
                }
            }
            variantData.put("totalSales", totalSales);
            variantData.put("totalProfit", totalProfit);
            variantData.put("profitMargin", totalSales > 0 ? ((double) totalProfit / totalSales) * 100 : 0);
            
            sampleData.add(variantData);
        }
        result.put("sampleData", sampleData);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/track/{trackingCode}")
    public ResponseEntity<?> getOrderStatusHistoryByTrackingCode(@PathVariable String trackingCode) {
        var orderOpt = orderRepository.findByTrackingCode(trackingCode);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var order = orderOpt.get();
        var history = orderStatusHistoryRepository.findByOrderOrderByTimestampAsc(order);
        var result = history.stream().map(h -> Map.of(
            "status", h.getStatus().toString(),
            "timestamp", h.getTimestamp()
        )).toList();

        // Adjust quantities for pending refund requests
        java.util.List<com.maven.demo.entity.RefundRequestEntity> pendingRefunds = refundRequestRepository.findByStatus(com.maven.demo.entity.RefundStatus.REQUESTED);
        java.util.Map<Long, Integer> pendingQtyByDetail = new java.util.HashMap<>();
        for (var refund : pendingRefunds) {
            if (refund.getOrder() != null && refund.getOrder().getId().equals(order.getId()) && refund.getOrderDetail() != null && refund.getRefundQuantity() != null) {
                pendingQtyByDetail.merge(refund.getOrderDetail().getId(), refund.getRefundQuantity(), Integer::sum);
            }
        }

        // Delivery info
        String address = "";
        if (order.getDeliveryAddress() != null) {
            var addr = order.getDeliveryAddress();
            address = String.format("%s, %s, %s, %s, %s",
                addr.getHouseNumber() != null ? addr.getHouseNumber() : "",
                addr.getTownship() != null ? addr.getTownship() : "",
                addr.getCity() != null ? addr.getCity() : "",
                addr.getState() != null ? addr.getState() : "",
                addr.getCountry() != null ? addr.getCountry() : ""
            ).replaceAll(",\\s*,", ",").replaceAll("^,|,$", "").trim();
        }
        String method = order.getDeliveryMethod();
        String provider = order.getDeliveryProvider();

        // Optionally, add adjusted quantities to the response (for frontend to use)
        java.util.List<java.util.Map<String, Object>> adjustedOrderDetails = new java.util.ArrayList<>();
        if (order.getOrderDetails() != null) {
            for (var detail : order.getOrderDetails()) {
                int pendingQty = pendingQtyByDetail.getOrDefault(detail.getId(), 0);
                int adjustedQty = Math.max(0, detail.getQuantity() - pendingQty);
                java.util.Map<String, Object> detailMap = new java.util.HashMap<>();
                detailMap.put("id", detail.getId());
                detailMap.put("originalQuantity", detail.getQuantity());
                detailMap.put("pendingRefundQuantity", pendingQty);
                detailMap.put("adjustedQuantity", adjustedQty);
                detailMap.put("price", detail.getPrice());
                // Add more fields as needed
                adjustedOrderDetails.add(detailMap);
            }
        }

        return ResponseEntity.ok(Map.of(
            "orderId", order.getId(),
            "trackingCode", order.getTrackingCode(),
            "history", result,
            "deliveryAddress", address,
            "deliveryMethod", method,
            "carrier", provider,
            "orderDetails", adjustedOrderDetails,
            "estimatedDeliveryTime", order.getEstimatedDeliveryTime()
        ));
    }

    @GetMapping("/refund/{trackingCode}")
    public ResponseEntity<?> getOrderForRefund(@PathVariable String trackingCode) {
        var orderOpt = orderRepository.findByTrackingCode(trackingCode);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var order = orderOpt.get();

        // Refund eligibility check
        if (!(order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.COMPLETED)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Refunds are only allowed for orders with status DELIVERED or COMPLETED."));
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            var completedAt = order.getOrderDate(); // Replace with completed timestamp if available
            if (completedAt != null && java.time.temporal.ChronoUnit.DAYS.between(completedAt, java.time.LocalDateTime.now()) > 7) {
                return ResponseEntity.badRequest().body(Map.of("message", "Refunds are only allowed within 7 days after COMPLETED status."));
            }
        }

        var dto = new OrderRefundDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getTrackingCode());
        dto.setTrackingCode(order.getTrackingCode());
        dto.setOrderDate(order.getOrderDate());

        var orderDetails = order.getOrderDetails().stream()
            .map(detail -> {
                var detailDto = new OrderRefundDTO.OrderDetailRefundDTO();
                detailDto.setId(detail.getId());
                detailDto.setQuantity(detail.getQuantity());
                detailDto.setPrice(detail.getPrice());
                detailDto.setDiscountAmount(detail.getDiscountAmount());
                detailDto.setDiscountPercent(detail.getDiscountPercent());
                detailDto.setRefunded(detail.isRefunded());
                detailDto.setRefundedQty(detail.getRefundedQty());
                // Sum all refund requests for this detail with status REQUESTED or APPROVED
                int requestedOrApprovedQty = refundRequestRepository
                    .findByOrderDetail(detail)
                    .stream()
                    .filter(r -> r.getStatus() == com.maven.demo.entity.RefundStatus.REQUESTED || r.getStatus() == com.maven.demo.entity.RefundStatus.APPROVED)
                    .mapToInt(r -> r.getRefundQuantity() != null ? r.getRefundQuantity() : 0)
                    .sum();
                int remainingQty = detail.getQuantity() - requestedOrApprovedQty;
                detailDto.setRemainingQty(remainingQty);
                System.out.println("Detail " + detail.getId() + ": qty=" + detail.getQuantity() + ", requestedOrApprovedQty=" + requestedOrApprovedQty + ", remainingQty=" + remainingQty);

                // Calculate actualRefundableAmount (proportional refund after both event and coupon discounts, including delivery fee in coupon ratio)
                int itemSubtotal = (detail.getPrice() - (detail.getDiscountAmount() != null ? detail.getDiscountAmount() : 0)) * detail.getQuantity();
                int orderSubtotal = order.getSubtotal() != null ? order.getSubtotal() : 0;
                int orderDeliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : 0;
                int orderDiscount = order.getDiscountAmount() != null ? order.getDiscountAmount() : 0;
                double couponRatio = (orderSubtotal + orderDeliveryFee) > 0 ? (orderDiscount / (double)(orderSubtotal + orderDeliveryFee)) : 0.0;
                int itemCouponDiscount = (int)Math.round(itemSubtotal * couponRatio);
                int actualRefundableAmount = itemSubtotal - itemCouponDiscount;
                detailDto.setActualRefundableAmount(actualRefundableAmount);

                var variant = detail.getVariant();
                if (variant != null) {
                    var variantDto = new OrderRefundDTO.VariantRefundDTO();
                    variantDto.setId(variant.getId());
                    variantDto.setSku(variant.getSku());
                    // Convert attribute values to a mapx
                    Map<String, String> attributes = variant.getAttributeValues().stream()
                        .collect(Collectors.toMap(
                            av -> av.getAttribute().getName(),
                            av -> av.getValue()
                        ));
                    variantDto.setAttributes(attributes);
                    // Get first image URL
                    if (!variant.getImages().isEmpty()) {
                        variantDto.setImageUrl(variant.getImages().get(0).getImageUrl());
                    }
                    var product = variant.getProduct();
                    if (product != null) {
                        var productDto = new OrderRefundDTO.ProductRefundDTO();
                        productDto.setId(product.getId());
                        productDto.setName(product.getName());
                        productDto.setDescription(product.getDescription());
                        variantDto.setProduct(productDto);
                    }
                    detailDto.setVariant(variantDto);
                }

                return detailDto;
            })
            .filter(detail -> detail.getRemainingQty() > 0)
            .collect(Collectors.toList());

        dto.setOrderDetails(orderDetails);
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setSubtotal(order.getSubtotal());
        dto.setTotal(order.getTotal());
        dto.setDeliveryFee(order.getDeliveryFee());
        dto.setAppliedCouponCode(order.getAppliedCouponCode());
        dto.setDiscountType(order.getDiscountType());
        dto.setDiscountValue(order.getDiscountValue());

        // Debug log for backend
        System.out.println("Refund DTO orderDetails: " + orderDetails);
        System.out.println("discountType: " + order.getDiscountType() + ", discountValue: " + order.getDiscountValue());

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{orderId}/update-estimated-delivery")
    public ResponseEntity<?> updateEstimatedDeliveryTime(@PathVariable Long orderId) {
        try {
            orderService.updateEstimatedDeliveryTimeForOrder(orderId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Estimated delivery time updated successfully."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update estimated delivery time: " + e.getMessage()
            ));
        }
    }
}
