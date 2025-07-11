package com.maven.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.maven.demo.dto.AddressDTO;
import com.maven.demo.dto.BestSellerProductDTO;
import com.maven.demo.dto.CartItemDTO;
import com.maven.demo.dto.CheckoutRequestDTO;
import com.maven.demo.dto.DailyOrderDetailDTO;
import com.maven.demo.dto.DashboardStatsDTO;
import com.maven.demo.dto.OrderDetailDTO;
import com.maven.demo.dto.OrderDetailVariantDTO;
import com.maven.demo.dto.OrderResponseDTO;
import com.maven.demo.dto.PaymentRequestDTO;
import com.maven.demo.dto.PaymentResponseDTO;
import com.maven.demo.dto.ProductSalesHistoryDTO;
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.SalesTrendDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.CouponEntity;
import com.maven.demo.entity.CustomerTypeEntity;
import com.maven.demo.entity.DeliveryEntity;
import com.maven.demo.entity.NotificationEntity;
import com.maven.demo.entity.OrderDetailEntity;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.OrderStatus;
import com.maven.demo.entity.OrderStatusHistory;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.PurchaseHistoryEntity;
import com.maven.demo.entity.SaleFifoMappingEntity;
import com.maven.demo.entity.ShopAddressEntity;
import com.maven.demo.entity.TotalSpendEntity;
import com.maven.demo.entity.TransactionEntity;
import com.maven.demo.entity.TransactionStatus;
import com.maven.demo.entity.UserCouponUsageEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.AddressRepository;
import com.maven.demo.repository.CouponRepository;
import com.maven.demo.repository.CustomerTypeRepository;
import com.maven.demo.repository.DeliveryRepository;
import com.maven.demo.repository.NotificationRepository;
import com.maven.demo.repository.NotificationTargetRoleRepository;
import com.maven.demo.repository.OrderRepository;
import com.maven.demo.repository.OrderStatusHistoryRepository;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.repository.PurchaseHistoryRepository;
import com.maven.demo.repository.RefundRequestRepository;
import com.maven.demo.repository.RoleRepository;
import com.maven.demo.repository.SaleFifoMappingRepository;
import com.maven.demo.repository.TotalSpendRepository;
import com.maven.demo.repository.TransactionRepository;
import com.maven.demo.repository.UserCouponUsageRepository;
import com.maven.demo.repository.UserRepository;

@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductVariantRepository variantRepository;
    @Autowired
    private PurchaseHistoryRepository purchaseHistoryRepository;
    @Autowired
    private SaleFifoMappingRepository saleFifoMappingRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private CouponService couponService;
    @Autowired
    private AddressRepository addressRepository;
    @Autowired
    private AddressService addressService;
    @Autowired
    private UserCouponUsageRepository userCouponUsageRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Autowired
    private TotalSpendRepository totalSpendRepository;
    @Autowired
    private CustomerTypeRepository customerTypeRepository;
    @Autowired
    private CouponRepository couponRepository;
    @Autowired
    private RefundRequestRepository refundRequestRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private NotificationTargetRoleRepository notificationTargetRoleRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private DeliveryRepository deliveryRepository;

    @Override
    @Transactional
    public OrderEntity placeOrder(CheckoutRequestDTO dto) {
        UserEntity user = userRepository.findById(dto.getUserId()).orElseThrow();
        OrderEntity order = new OrderEntity();
        order.setUser(user);
        order.setSubtotal(dto.getSubtotal());
        order.setDiscountAmount(dto.getDiscountAmount());
        order.setDiscountType(dto.getDiscountType());
        order.setDiscountValue(dto.getDiscountValue());
        order.setAppliedCouponCode(dto.getAppliedCouponCode());
        System.out.println("total :"+dto.getTotal());

        order.setTotal(dto.getTotal());
        order.setDeliveryFee(dto.getDeliveryFee());
        order.setDeliveryMethod(dto.getDeliveryMethod());
        order.setDeliveryProvider(dto.getDeliveryProvider());
        order.setStatus(OrderStatus.PENDING); // Set as needed
        if (dto.getDeliveryAddressId() != null) {
            AddressEntity address = addressRepository.findById(dto.getDeliveryAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
            order.setDeliveryAddress(address);
        }

        List<OrderDetailEntity> orderDetails = new ArrayList<>();
        for (CartItemDTO item : dto.getItems()) {
            ProductVariantEntity variant = variantRepository.findById(item.getVariantId()).orElseThrow();
            if (variant.getStock() < item.getQuantity()) throw new RuntimeException("Not enough stock");
            variant.setStock(variant.getStock() - item.getQuantity());
            variantRepository.save(variant);

            OrderDetailEntity detail = new OrderDetailEntity();
            detail.setOrder(order);
            detail.setVariant(variant);
            detail.setQuantity(item.getQuantity());
            detail.setPrice(item.getPrice());
            detail.setDiscountPercent(item.getDiscountPercent());
            detail.setDiscountAmount(item.getDiscountAmount());
            orderDetails.add(detail);
        }
        order.setOrderDetails(orderDetails);
        System.out.println("total 2 :"+order.getTotal());
        order = orderRepository.save(order); // Save order and details first
        // trackingCode is now set by @PrePersist
        System.out.println("Order tracking code: " + order.getTrackingCode());

        // Save order status history: PENDING
        OrderStatusHistory pendingHistory = new OrderStatusHistory();
        pendingHistory.setOrder(order);
        pendingHistory.setStatus(OrderStatus.PENDING);
        pendingHistory.setTimestamp(java.time.LocalDateTime.now());
        orderStatusHistoryRepository.save(pendingHistory);

        // Record coupon usage if a coupon was applied
        if (order.getAppliedCouponCode() != null && !order.getAppliedCouponCode().isEmpty()) {
            CouponEntity coupon = couponService.findByCode(order.getAppliedCouponCode())
                .orElseThrow(() -> new RuntimeException("Coupon not found when saving usage"));
            UserCouponUsageEntity usage = new UserCouponUsageEntity();
            usage.setUser(user);
            usage.setCoupon(coupon);
            usage.setDate(java.time.LocalDate.now().toString());
            userCouponUsageRepository.save(usage);
        }

        // Now process FIFO and SaleFifoMappingEntity creation
        for (OrderDetailEntity detail : order.getOrderDetails()) {
            int remaining = detail.getQuantity();
            ProductVariantEntity variant = detail.getVariant();
            List<PurchaseHistoryEntity> purchases = purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant);
            for (int i = purchases.size() - 1; i >= 0 && remaining > 0; i--) { // Ascending order
                PurchaseHistoryEntity purchase = purchases.get(i);
                int available = purchase.getRemainingQuantity();
                if (available <= 0) continue;
                int used = Math.min(available, remaining);
                purchase.setRemainingQuantity(available - used);
                purchaseHistoryRepository.save(purchase);

                SaleFifoMappingEntity mapping = new SaleFifoMappingEntity();
                mapping.setOrderDetail(detail);
                mapping.setPurchaseHistory(purchase);
                mapping.setQuantity(used);
                mapping.setUnitCost(purchase.getPurchasePrice());
                saleFifoMappingRepository.save(mapping);

                remaining -= used;
            }
            if (remaining > 0) throw new RuntimeException("Not enough stock in purchase history");
        }

        // --- Low Stock Notification for Admins ---
        for (OrderDetailEntity detail : order.getOrderDetails()) {
            ProductVariantEntity variant = detail.getVariant();
            if (variant != null && variant.getStock() < 10) {
                // Create notification entity
                NotificationEntity notification = new NotificationEntity();
                notification.setTitle("Low Stock Alert");
                String productName = variant.getProduct() != null ? variant.getProduct().getName() : "Unknown Product";
                // Build attribute values string
                StringBuilder attrBuilder = new StringBuilder();
                if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                    for (var attrVal : variant.getAttributeValues()) {
                        if (attrVal.getAttribute() != null && attrVal.getValue() != null) {
                            if (attrBuilder.length() > 0) attrBuilder.append(", ");
                            attrBuilder.append(attrVal.getAttribute().getName()).append(": ").append(attrVal.getValue());
                        }
                    }
                }
                String attrString = attrBuilder.length() > 0 ? attrBuilder.toString() : "";
                String message = String.format(
                    "⚠️ <b>Low Stock Alert</b><br><br>" +
                    "Product: <b>%s</b><br>" +
                    "SKU: <code>%s</code>%s<br>" +
                    "Remaining Stock: <b style='color:red;'>%d units</b><br><br>" +
                    "Please restock this item to avoid order delays.",
                    productName,
                    variant.getSku(),
                    attrString.isBlank() ? "" : "<br>Variant: " + attrString,
                    variant.getStock()
                );
                notification.setMessage(message);
                notification.setType("STOCK");
                notification.setSource(com.maven.demo.entity.NotificationSource.SYSTEM);
                notification.setSender(null);
                notification.setRelatedObjectId(variant.getProduct() != null ? variant.getProduct().getId() : null);
                notification.setRead(false);
                notification.setCreatedAt(java.time.LocalDateTime.now());
                notification = notificationRepository.save(notification);

                // Link to admin role
                java.util.Optional<com.maven.demo.entity.RoleEntity> adminRoleOpt = roleRepository.findByType("ADMIN");
                if (adminRoleOpt.isPresent()) {
                    com.maven.demo.entity.RoleEntity adminRole = adminRoleOpt.get();
                    com.maven.demo.entity.NotificationTargetRoleEntity targetRole = new com.maven.demo.entity.NotificationTargetRoleEntity();
                    targetRole.setNotification(notification);
                    targetRole.setRole(adminRole);
                    notificationTargetRoleRepository.save(targetRole);

                    // --- Broadcast to all admin users via WebSocket ---
                    java.util.List<com.maven.demo.entity.UserEntity> admins = userRepository.findByRoleId(2L);
                    com.maven.demo.dto.NotificationDTO stockDto = com.maven.demo.dto.NotificationDTO.fromEntity(notification);
                    for (com.maven.demo.entity.UserEntity admin : admins) {
                        notificationService.messagingTemplate.convertAndSend("/topic/notifications.user." + admin.getId(), stockDto);
                    }
                }
            }
        }
        return order;
    }

    @Override
    public OrderEntity applyCouponToOrder(Long orderId, String couponCode) {
        OrderEntity order = orderRepository.findById(orderId).orElseThrow();
        CouponEntity coupon = couponService.findByCode(couponCode)
            .orElseThrow(() -> new RuntimeException("Coupon not found"));
        double discount = couponService.applyCouponToAmount(couponCode, order.getUser().getId(), order.getSubtotal());
        order.setDiscountAmount((int) discount);
        order.setDiscountType(coupon.getType());
        order.setDiscountValue(coupon.getDiscount());
        order.setAppliedCouponCode(couponCode);
        order.setTotal(order.getTotal());
        orderRepository.save(order);
        return order;
    }

    @Override
    public OrderEntity getOrderById(Long orderId) {
        return orderRepository.findByIdWithDetails(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }

    @Override
    public List<OrderEntity> getOrdersByUser(Long userId) {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        return orderRepository.findByUserWithDetailsOrderByOrderDateDesc(user);
    }

    @Override
    public List<OrderEntity> getOrdersByUserAndStatus(Long userId, OrderStatus status) {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        return orderRepository.findByUserAndStatusWithDetailsOrderByOrderDateDesc(user, status);
    }

    @Override
    public List<OrderEntity> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatusOrderByOrderDateDesc(status);
    }

    @Override
    public List<OrderEntity> getOrdersWithTransactions(String status, String startDate, String endDate, String searchTerm) {
        List<OrderEntity> allOrders = orderRepository.findAllWithDetailsOrderByOrderDateDesc();
        // Filter orders that have transactions
        List<OrderEntity> ordersWithTransactions = allOrders.stream()
            .filter(order -> transactionRepository.findByOrder(order).isPresent())
            .collect(java.util.stream.Collectors.toList());
        // Apply status filter
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                ordersWithTransactions = ordersWithTransactions.stream()
                    .filter(order -> order.getStatus() == orderStatus)
                    .collect(java.util.stream.Collectors.toList());
            } catch (IllegalArgumentException e) {
                return new ArrayList<>();
            }
        }
        // Apply date range filter
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                ordersWithTransactions = ordersWithTransactions.stream()
                    .filter(order -> order.getOrderDate().toLocalDate().isAfter(start.minusDays(1)))
                    .collect(java.util.stream.Collectors.toList());
            } catch (Exception e) {}
        }
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                ordersWithTransactions = ordersWithTransactions.stream()
                    .filter(order -> order.getOrderDate().toLocalDate().isBefore(end.plusDays(1)))
                    .collect(java.util.stream.Collectors.toList());
            } catch (Exception e) {}
        }
        // Apply search filter
        if (searchTerm != null && !searchTerm.isEmpty()) {
            String searchLower = searchTerm.toLowerCase();
            ordersWithTransactions = ordersWithTransactions.stream()
                .filter(order -> 
                    order.getTrackingCode().toLowerCase().contains(searchLower) ||
                    order.getId().toString().contains(searchTerm) ||
                    (order.getUser() != null && order.getUser().getName().toLowerCase().contains(searchLower))
                )
                .collect(java.util.stream.Collectors.toList());
        }
        return ordersWithTransactions;
    }

    @Override
    public OrderResponseDTO toOrderResponseDTO(OrderEntity order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setSubtotal(order.getSubtotal());
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setDiscountType(order.getDiscountType());
        dto.setDiscountValue(order.getDiscountValue());
        dto.setAppliedCouponCode(order.getAppliedCouponCode());
        dto.setTotal(order.getTotal());
        dto.setDeliveryFee(order.getDeliveryFee());
        dto.setDeliveryMethod(order.getDeliveryMethod());
        dto.setDeliveryProvider(order.getDeliveryProvider());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus().toString());
        dto.setTrackingCode(order.getTrackingCode());
        
        if (order.getDeliveryAddress() != null) {
            AddressDTO addressDTO = addressService.getAddressesByUserId(order.getDeliveryAddress().getUser().getId())
                .stream()
                .filter(a -> a.getId().equals(order.getDeliveryAddress().getId()))
                .findFirst()
                .orElse(null);
            dto.setDeliveryAddress(addressDTO);
        }
        
        // Map user info
        if (order.getUser() != null) {
            com.maven.demo.dto.UserResponseDTO userDto = new com.maven.demo.dto.UserResponseDTO();
            userDto.setId(order.getUser().getId());
            userDto.setName(order.getUser().getName());
            userDto.setEmail(order.getUser().getEmail());
            userDto.setGender(order.getUser().getGender());
            userDto.setPhoneNumber(order.getUser().getPhoneNumber());
            userDto.setImageUrls(order.getUser().getImageUrls());
            userDto.setStatus(order.getUser().getStatus());
            if (order.getUser().getRole() != null) {
                userDto.setRoleId(order.getUser().getRole().getId());
            }
            dto.setUser(userDto);
        }
        
        List<OrderDetailDTO> details = order.getOrderDetails().stream().map(detail -> {
            OrderDetailDTO d = new OrderDetailDTO();
            d.setId(detail.getId());
            d.setQuantity(detail.getQuantity());
            d.setPrice(detail.getPrice());
            d.setVariantId(detail.getVariant().getId());
            
            // Populate variant info - handle lazy loading
            OrderDetailVariantDTO vdto = new OrderDetailVariantDTO();
            vdto.setId(detail.getVariant().getId());
            vdto.setSku(detail.getVariant().getSku());
            vdto.setProductName(detail.getVariant().getProduct().getName());
            
            // Handle images - access the collection to trigger lazy loading
            try {
                vdto.setImageUrls(detail.getVariant().getImages().stream()
                    .map(img -> img.getImageUrl())
                    .collect(java.util.stream.Collectors.toList()));
            } catch (Exception e) {
                // If lazy loading fails, set empty list
                vdto.setImageUrls(new ArrayList<>());
            }
            
            // Handle attributes - access the collection to trigger lazy loading
            try {
                vdto.setAttributes(detail.getVariant().getAttributeValues().stream()
                    .collect(java.util.stream.Collectors.toMap(
                        v -> v.getAttribute().getName(),
                        v -> v.getValue()
                    )));
            } catch (Exception e) {
                // If lazy loading fails, set empty map
                vdto.setAttributes(new HashMap<>());
            }
            
            d.setVariant(vdto);
            d.setRefunded(detail.isRefunded());
            d.setRefundedQty(detail.getRefundedQty());
            d.setDiscountPercent(detail.getDiscountPercent());
            d.setDiscountAmount(detail.getDiscountAmount());
            return d;
        }).collect(java.util.stream.Collectors.toList());

        // After mapping other fields
        TransactionEntity transaction = transactionRepository.findByOrder(order).orElse(null);
        if (transaction != null && transaction.getPaymentMethod() != null) {
            dto.setPaymentMethod(transaction.getPaymentMethod());
        }
        
        dto.setOrderDetails(details);
        Integer refundedAmount = refundRequestRepository.findByOrderId(order.getId()).stream()
            .filter(r -> r.getStatus() == com.maven.demo.entity.RefundStatus.APPROVED)
            .mapToInt(r -> r.getAmount() != null ? r.getAmount() : 0)
            .sum();
        dto.setRefundedAmount(refundedAmount);
        dto.setEstimatedDeliveryTime(order.getEstimatedDeliveryTime());
        return dto;
    }

    @Override
    @Transactional
    public PaymentResponseDTO processPayment(PaymentRequestDTO paymentRequest) {
        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setOrderId(paymentRequest.getOrderId());
        response.setPaymentMethod(paymentRequest.getPaymentMethod());
        
        try {
            // Find the order
            OrderEntity order = orderRepository.findById(paymentRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Check if order is in PENDING status
            if (order.getStatus() != OrderStatus.PENDING) {
                response.setSuccess(false);
                response.setPaymentStatus("FAILED");
                response.setMessage("Order is not in pending status for payment");
                return response;
            }
            
            // Process payment based on method
            if ("CreditCard".equals(paymentRequest.getPaymentMethod())) {
                // Simulate credit card payment processing
                if (paymentRequest.getCardNumber() != null && !paymentRequest.getCardNumber().isEmpty() &&
                    paymentRequest.getExpiry() != null && !paymentRequest.getExpiry().isEmpty() &&
                    paymentRequest.getCvv() != null && !paymentRequest.getCvv().isEmpty()) {
                    
                    // Simulate successful credit card payment
                    order.setStatus(OrderStatus.PAID);
                    orderRepository.save(order);
                    
                    response.setSuccess(true);
                    response.setPaymentStatus("PAID");
                    response.setMessage("Credit card payment processed successfully");
                    response.setTransactionId("CC-" + System.currentTimeMillis());
                } else {
                    response.setSuccess(false);
                    response.setPaymentStatus("FAILED");
                    response.setMessage("Invalid credit card details");
                }
            } else {
                // QR code payment (requires receipt verification)
                if (paymentRequest.getReceiptImageUrl() != null && !paymentRequest.getReceiptImageUrl().isEmpty()) {
                    // Set order to PENDING_VERIFICATION for admin review
                    order.setStatus(OrderStatus.PENDING_VERIFICATION);
                    orderRepository.save(order);
                    
                    response.setSuccess(true);
                    response.setPaymentStatus("PENDING_VERIFICATION");
                    response.setMessage("Payment receipt uploaded. Awaiting admin verification.");
                    response.setTransactionId("QR-" + System.currentTimeMillis());
                } else {
                    response.setSuccess(false);
                    response.setPaymentStatus("FAILED");
                    response.setMessage("Payment receipt is required for QR code payments");
                }
            }
            
        } catch (Exception e) {
            response.setSuccess(false);
            response.setPaymentStatus("FAILED");
            response.setMessage("Payment processing failed: " + e.getMessage());
        }
        
        return response;
    }

    @Transactional
    public void markOrderPaidAndCreateTransaction(Long orderId, String paymentMethod, Integer amount, String proofImageUrl, Long reviewerUserId, String notes) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Order is not in pending status");
        }
        // Set order status to PAID
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // Save order status history: PAID
        OrderStatusHistory paidHistory = new OrderStatusHistory();
        paidHistory.setOrder(order);
        paidHistory.setStatus(OrderStatus.PAID);
        paidHistory.setTimestamp(java.time.LocalDateTime.now());
        orderStatusHistoryRepository.save(paidHistory);

        // Create transaction with status PENDING
        TransactionEntity transaction = new TransactionEntity();
        transaction.setOrder(order);
        transaction.setAmount(amount);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setCreatedAt(java.time.LocalDateTime.now());
        transaction.setProofImageUrl(proofImageUrl);
        if (reviewerUserId != null) {
            UserEntity reviewer = userRepository.findById(reviewerUserId).orElse(null);
            transaction.setUser(reviewer);
        }
        transaction.setNotes(notes);
        transactionRepository.save(transaction);
    }

    public com.maven.demo.dto.TransactionDTO toTransactionDTO(TransactionEntity entity) {
        if (entity == null) return null;
        com.maven.demo.dto.TransactionDTO dto = new com.maven.demo.dto.TransactionDTO();
        dto.setId(entity.getId());
        dto.setAmount(entity.getAmount());
        dto.setPaymentMethod(entity.getPaymentMethod());
        dto.setStatus(entity.getStatus() != null ? entity.getStatus().toString() : null);
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setConfirmedAt(entity.getConfirmedAt());
        dto.setProofImageUrl(entity.getProofImageUrl());
        dto.setNotes(entity.getNotes());
        return dto;
    }

    public com.maven.demo.dto.TransactionDTO getTransactionByOrderId(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        TransactionEntity entity = transactionRepository.findByOrder(order)
                .orElse(null);
        return toTransactionDTO(entity);
    }

    @Override
    public OrderEntity updateOrderStatus(Long orderId, String status, String reason) {
        OrderEntity order = orderRepository.findByIdWithDetails(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
        OrderStatus currentStatus = order.getStatus();

        // Only allow valid transitions
        if (currentStatus == OrderStatus.ACCEPTED && newStatus != OrderStatus.SHIPPED
            || currentStatus == OrderStatus.SHIPPED && newStatus != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Invalid status transition");
        }

        // Prevent status change if all order details are refunded
        if (order.getOrderDetails() != null && order.getOrderDetails().stream().allMatch(od -> Boolean.TRUE.equals(od.isRefunded()))) {
            order.setStatus(OrderStatus.REFUNDED);
            orderRepository.save(order);
            return order;
        }

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.CANCELLED && reason != null) {
            order.setNotes(reason);
        }
        orderRepository.save(order);

        // Insert into order status history
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus(newStatus);
        history.setTimestamp(java.time.LocalDateTime.now());
        orderStatusHistoryRepository.save(history);

        if (newStatus == OrderStatus.CANCELLED) {
            TransactionEntity transaction = transactionRepository.findByOrder(order).orElse(null);
            if (transaction != null) {
                transaction.setStatus(TransactionStatus.CANCELLED); // or another appropriate status
                transaction.setNotes(reason);
                transactionRepository.save(transaction);
            }
            // Remove UserCouponUsageEntity if coupon was used
            removeCouponUsageForOrder(order);
            // Refill stock
            refillStockForOrder(order);
            // --- Notification logic for rejected order ---
            UserEntity user = order.getUser();
            if (user != null) {
                String title = " Order Rejected!";
                StringBuilder messageBuilder = new StringBuilder();

                messageBuilder.append(String.format(
                        "Unfortunately, your order <b>#%s</b> has been <b>rejected</b> and will not be processed.<br><br>",
                        order.getTrackingCode()
                ));

                if (reason != null && !reason.isEmpty()) {
                    messageBuilder.append(String.format("<b>📄 Due to:</b> %s<br><br>", reason));
                }

                messageBuilder.append("If you believe this was a mistake or need help, please contact our <b>support team</b>.");

                notificationService.createUserNotification(user, title, messageBuilder.toString(), "ORDER", order.getId());
            }

            // --- End notification logic for rejected order ---
        }

        // Update transaction status if order is accepted
        if (newStatus == OrderStatus.ACCEPTED) {
            TransactionEntity transaction = transactionRepository.findByOrder(order).orElse(null);
            if (transaction != null) {
                transaction.setStatus(TransactionStatus.SUCCESS); // or another appropriate status
                transactionRepository.save(transaction);
            }
            
            // Calculate and set estimated delivery time based on delivery method
            LocalDateTime estimatedDeliveryTime = calculateEstimatedDeliveryTime(order);
            order.setEstimatedDeliveryTime(estimatedDeliveryTime);
            orderRepository.save(order);
            
            // Debug logging
            System.out.println("Order " + order.getId() + " estimated delivery time set to: " + estimatedDeliveryTime);
            System.out.println("Order date: " + order.getOrderDate());
            System.out.println("Delivery method: " + order.getDeliveryMethod());
            System.out.println("Delivery provider: " + order.getDeliveryProvider());
            // --- Loyalty logic start ---
            UserEntity user = order.getUser();
            int orderTotal = order.getTotal() != null ? order.getTotal() : 0;
            TotalSpendEntity totalSpend = totalSpendRepository.findByUser(user).orElse(null);
            if (totalSpend == null) {
                totalSpend = new TotalSpendEntity();
                totalSpend.setUser(user);
                totalSpend.setAmount(orderTotal);
            } else {
                totalSpend.setAmount(totalSpend.getAmount() + orderTotal);
            }
            totalSpendRepository.save(totalSpend);

            int total = totalSpend.getAmount();
            CustomerTypeEntity newType = null;
            if (total > 6000000) {
                newType = customerTypeRepository.findById(3L).orElse(null); // VIP
            } else if (total > 3000000) {
                newType = customerTypeRepository.findById(2L).orElse(null); // Loyality
            }
            if (newType != null && (user.getCustomerType() == null || !user.getCustomerType().getId().equals(newType.getId()))) {
                user.setCustomerType(newType);
                userRepository.save(user);
            }
            // --- Loyalty logic end ---

            // --- Notification logic start ---
            if (user != null) {
                String orderNumber = order.getTrackingCode();
                String title = "Order Accepted!";

                // Build delivery info
                String deliveryInfo = "";
                if (order.getDeliveryAddress() != null) {
                    deliveryInfo += String.format("<b>🏠 Delivery Address:</b> %s, %s, %s, %s, %s<br>",
                        order.getDeliveryAddress().getHouseNumber(),
                        order.getDeliveryAddress().getWardName(),
                        order.getDeliveryAddress().getStreet(),
                        order.getDeliveryAddress().getCity(),
                        order.getDeliveryAddress().getState()
                    );
                }
                if (order.getDeliveryMethod() != null) {
                    deliveryInfo += String.format("<b>🚚 Delivery Type:</b> %s<br>", order.getDeliveryMethod());
                }

                // Use calculated estimated delivery time
                String estimatedDeliveryText = "";
                if (order.getEstimatedDeliveryTime() != null) {
                    estimatedDeliveryText = order.getEstimatedDeliveryTime().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
                } else {
                    // Fallback if not calculated yet
                    LocalDate estimatedArrival = LocalDate.now().plusDays(3);
                    estimatedDeliveryText = estimatedArrival.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
                }

                String message = String.format(
                        "Great news! Your order <b>#%s</b> has been <b>accepted</b> and is now being prepared for shipping.<br><br>" +
                                "<b>🧾 Tracking Code:</b> %s<br>" +
                                "<b>📦 Estimated Arrival:</b> %s<br>" +
                                "%s<br>" +
                                "We'll notify you when it's shipped. Thank you for shopping with us!",
                        orderNumber, orderNumber, estimatedDeliveryText, deliveryInfo
                );

                notificationService.createUserNotification(user, title, message, "ORDER", order.getId());
            }

            // --- Notification logic end ---
        }

        return order;
    }

    private void refillStockForOrder(OrderEntity order) {
        if (order.getOrderDetails() != null) {
            for (OrderDetailEntity detail : order.getOrderDetails()) {
                // Refill variant stock
                var variant = detail.getVariant();
                if (variant != null) {
                    variant.setStock(variant.getStock() + detail.getQuantity());
                    variantRepository.save(variant);
                }
                // Refill purchase history remainingQuantity via SaleFifoMapping
                var mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                for (var mapping : mappings) {
                    var purchase = mapping.getPurchaseHistory();
                    if (purchase != null) {
                        purchase.setRemainingQuantity(purchase.getRemainingQuantity() + mapping.getQuantity());
                        purchaseHistoryRepository.save(purchase);
                    }
                }
            }
        }
    }

    // Auto-cancel unpaid orders older than 3 days
    @Transactional
    public void autoCancelUnpaidOrders() {
        LocalDateTime threeDaysAgo = LocalDateTime.now().minusDays(3);
        List<OrderEntity> oldUnpaidOrders = orderRepository.findByStatusWithDetails(OrderStatus.PENDING);
        for (OrderEntity order : oldUnpaidOrders) {
            System.out.println("[CHECK] Order " + order.getId() + " orderDate: " + order.getOrderDate() + " (threeDaysAgo: " + threeDaysAgo + ")");
            if (order.getOrderDate().isBefore(threeDaysAgo)) {
                System.out.println("[CANCEL] Cancelling order " + order.getId());
                // Cancel the order
                order.setStatus(OrderStatus.CANCELLED);
                order.setNotes("Auto-cancelled after 3 days of no payment");
                orderRepository.save(order);

                // Cancel transaction if exists
                TransactionEntity transaction = transactionRepository.findByOrder(order).orElse(null);
                if (transaction != null) {
                    transaction.setStatus(TransactionStatus.CANCELLED);
                    transaction.setNotes("Auto-cancelled after 3 days of no payment");
                    transactionRepository.save(transaction);
                }

                // Remove coupon usage
                removeCouponUsageForOrder(order);

                // Refill stock
                refillStockForOrder(order);

                // Add to order status history
                OrderStatusHistory history = new OrderStatusHistory();
                history.setOrder(order);
                history.setStatus(OrderStatus.CANCELLED);
                history.setTimestamp(LocalDateTime.now());
                orderStatusHistoryRepository.save(history);
            }
        }
    }

    // Remove coupon usage for an order
    private void removeCouponUsageForOrder(OrderEntity order) {
        if (order.getAppliedCouponCode() != null && !order.getAppliedCouponCode().isEmpty()) {
            CouponEntity coupon = couponRepository.findByCode(order.getAppliedCouponCode()).orElse(null);
            if (coupon != null) {
                UserEntity user = order.getUser();
                java.util.List<UserCouponUsageEntity> usages = userCouponUsageRepository.findByUserAndCoupon(user, coupon);
                for (UserCouponUsageEntity usage : usages) {
                    userCouponUsageRepository.delete(usage);
                }
            }
        }
    }

    // Scheduled task to auto-cancel unpaid orders every minute (for testing)
    @Scheduled(cron = "0 * * * * *")
    public void scheduledAutoCancelUnpaidOrders() {

        autoCancelUnpaidOrders();
    }

    @Override
    public DashboardStatsDTO getDashboardStats() {
        int totalSales = 0;
        int totalCost = 0;
        int totalDeliveryFee = 0;
        int transactionCount = 0;
        int totalPurchaseAmount = 0;
        int normalCustomerCount = 0;
        int loyaltyCustomerCount = 0;
        int vipCustomerCount = 0;
        java.util.List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
        for (TransactionEntity tx : transactions) {
            totalSales += tx.getAmount() != null ? tx.getAmount() : 0;
            OrderEntity order = tx.getOrder();
            totalDeliveryFee += order.getDeliveryFee() != null ? order.getDeliveryFee() : 0;
            if (order.getOrderDetails() != null) {
                for (OrderDetailEntity detail : order.getOrderDetails()) {
                    java.util.List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                    for (SaleFifoMappingEntity mapping : mappings) {
                        totalCost += (mapping.getQuantity() != null ? mapping.getQuantity() : 0) * (mapping.getUnitCost() != null ? mapping.getUnitCost() : 0);
                    }
                }
            }
        }
        transactionCount = transactions.size();
        int profit = totalSales - totalCost - totalDeliveryFee;
        // Calculate total purchase amount (sum of all purchase history quantities * price)
        java.util.List<PurchaseHistoryEntity> allPurchases = purchaseHistoryRepository.findAll();
        for (PurchaseHistoryEntity ph : allPurchases) {
            totalPurchaseAmount += (ph.getQuantity() != null ? ph.getQuantity() : 0) * (ph.getPurchasePrice() != null ? ph.getPurchasePrice() : 0);
        }
        // Count customers by type
        java.util.List<UserEntity> allUsers = userRepository.findAll();
        for (UserEntity user : allUsers) {
            if (user.getCustomerType() != null) {
                Long typeId = user.getCustomerType().getId();
                if (typeId == 1L) normalCustomerCount++;
                else if (typeId == 2L) loyaltyCustomerCount++;
                else if (typeId == 3L) vipCustomerCount++;
            } 
        }
        return new DashboardStatsDTO(totalSales, totalCost, totalDeliveryFee, profit, transactionCount, totalPurchaseAmount, normalCustomerCount, loyaltyCustomerCount, vipCustomerCount);
    }

    @Override
    public List<SalesTrendDTO> getSalesTrend(java.time.LocalDate from, java.time.LocalDate to, String groupBy) {
        // Map: period label -> [sales, cost, deliveryFee, orderCount]
        Map<String, int[]> periodMap = new TreeMap<>();
        java.time.format.DateTimeFormatter dayFmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd");
        java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM");
        java.time.format.DateTimeFormatter weekFmt = java.time.format.DateTimeFormatter.ofPattern("YYYY-'W'ww");
        List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
        for (TransactionEntity tx : transactions) {
            java.time.LocalDate date = tx.getCreatedAt().toLocalDate();
            if ((from != null && date.isBefore(from)) || (to != null && date.isAfter(to))) continue;
            String period;
            switch (groupBy == null ? "day" : groupBy) {
                case "month": period = date.format(monthFmt); break;
                case "week": period = date.format(weekFmt); break;
                default: period = date.format(dayFmt); break;
            }
            int sales = tx.getAmount() != null ? tx.getAmount() : 0;
            int cost = 0;
            int deliveryFee = 0;
            OrderEntity order = tx.getOrder();
            deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : 0;
            if (order.getOrderDetails() != null) {
                for (OrderDetailEntity detail : order.getOrderDetails()) {
                    List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                    for (SaleFifoMappingEntity mapping : mappings) {
                        cost += (mapping.getQuantity() != null ? mapping.getQuantity() : 0) * (mapping.getUnitCost() != null ? mapping.getUnitCost() : 0);
                    }
                }
            }
            periodMap.computeIfAbsent(period, k -> new int[]{0,0,0,0});
            int[] values = periodMap.get(period);
            values[0] += sales;
            values[1] += cost;
            values[2] += deliveryFee;
            values[3] += 1; // order count
        }
        List<SalesTrendDTO> result = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : periodMap.entrySet()) {
            int sales = entry.getValue()[0];
            int cost = entry.getValue()[1];
            int deliveryFee = entry.getValue()[2];
            int orderCount = entry.getValue()[3];
            result.add(new SalesTrendDTO(entry.getKey(), sales, cost, deliveryFee, sales - cost - deliveryFee, orderCount));
        }
        return result;
    }

    @Override
    public List<DailyOrderDetailDTO> getDailyOrderDetails(java.time.LocalDate date) {
        List<DailyOrderDetailDTO> result = new ArrayList<>();
        List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
        
        for (TransactionEntity tx : transactions) {
            java.time.LocalDate orderDate = tx.getCreatedAt().toLocalDate();
            if (orderDate.equals(date)) {
                OrderEntity order = tx.getOrder();
                int sales = tx.getAmount() != null ? tx.getAmount() : 0;
                int cost = 0;
                int deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : 0;
                
                if (order.getOrderDetails() != null) {
                    for (OrderDetailEntity detail : order.getOrderDetails()) {
                        List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                        for (SaleFifoMappingEntity mapping : mappings) {
                            cost += (mapping.getQuantity() != null ? mapping.getQuantity() : 0) * (mapping.getUnitCost() != null ? mapping.getUnitCost() : 0);
                        }
                    }
                }
                
                int profit = sales - cost - deliveryFee;
                String customerName = order.getUser() != null ? order.getUser().getName() : "Unknown";
                
                result.add(new DailyOrderDetailDTO(
                    order.getId(),
                    order.getTrackingCode(),
                    customerName,
                    sales,
                    cost,
                    deliveryFee,
                    profit,
                    order.getOrderDate(),
                    order.getStatus().toString()
                ));
            }
        }
        
        return result;
    }

    @Override
    public List<BestSellerProductDTO> getBestSellerProducts(int limit) {
        Map<String, BestSellerProductDTO> productMap = new HashMap<>();
        List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
        
        for (TransactionEntity tx : transactions) {
            OrderEntity order = tx.getOrder();
            
            if (order.getOrderDetails() != null) {
                for (OrderDetailEntity detail : order.getOrderDetails()) {
                    ProductVariantEntity variant = detail.getVariant();
                    if (variant == null) continue;
                    String key = String.valueOf(variant.getId());
                    BestSellerProductDTO dto = productMap.get(key);
                    int quantity = detail.getQuantity();
                    // Exclude refunded quantities
                    int refundedQty = detail.getRefundedQty() != null ? detail.getRefundedQty() : 0;
                    int netQuantity = quantity - refundedQty;
                    if (netQuantity <= 0) continue; // skip fully refunded
                    
                    int sales = netQuantity * detail.getPrice();
                    int cost = 0;
                    // Calculate cost from FIFO mappings (only for netQuantity)
                    List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                    int qtyLeft = netQuantity;
                    for (SaleFifoMappingEntity mapping : mappings) {
                        int usedQty = Math.min(mapping.getQuantity(), qtyLeft);
                        cost += usedQty * mapping.getUnitCost();
                        qtyLeft -= usedQty;
                        if (qtyLeft <= 0) break;
                    }
                    
                    // Use netQuantity everywhere below
                    if (dto == null) {
                        String productName = variant.getProduct() != null ? variant.getProduct().getName() : "Unknown Product";
                        
                        // Build variant name from attributes
                        StringBuilder variantNameBuilder = new StringBuilder();
                        if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                            for (int i = 0; i < variant.getAttributeValues().size(); i++) {
                                if (i > 0) variantNameBuilder.append(" - ");
                                variantNameBuilder.append(variant.getAttributeValues().get(i).getValue());
                            }
                        } else {
                            variantNameBuilder.append("Default");
                        }
                        String variantName = variantNameBuilder.toString();
                        
                        dto = new BestSellerProductDTO(
                            variant.getId(),
                            productName,
                            variantName,
                            netQuantity,
                            sales,
                            cost,
                            0, // No delivery fee for best sellers
                            sales - cost, // Profit without delivery fee
                            0.0
                        );
                        productMap.put(key, dto);
                    } else {
                        dto.setTotalQuantitySold(dto.getTotalQuantitySold() + netQuantity);
                        dto.setTotalSales(dto.getTotalSales() + sales);
                        dto.setTotalCost(dto.getTotalCost() + cost);
                        dto.setTotalDeliveryFee(0); // No delivery fee for best sellers
                        dto.setTotalProfit(dto.getTotalProfit() + (sales - cost));
                    }
                }
            }
        }
        
        // Calculate profit margins and sort by total profit
        List<BestSellerProductDTO> result = new ArrayList<>(productMap.values());
        for (BestSellerProductDTO dto : result) {
            if (dto.getTotalSales() > 0) {
                double margin = ((double) dto.getTotalProfit() / dto.getTotalSales()) * 100;
                dto.setProfitMargin(margin);
            }
        }
        
        result.sort((a, b) -> Integer.compare(b.getTotalProfit(), a.getTotalProfit()));
        
        if (limit > 0 && result.size() > limit) {
            return result.subList(0, limit);
        }
        
        return result;
    }

    // Product Search Methods Implementation
    @Override
    public List<String> getProductCategories() {
        return variantRepository.findAll().stream()
            .map(variant -> variant.getProduct() != null ? variant.getProduct().getCategory().getName() : null)
            .filter(category -> category != null && !category.isEmpty())
            .distinct()
            .sorted()
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<ProductSearchResultDTO> searchProducts(String query, String type, String category, String stockStatus) {
        List<ProductSearchResultDTO> results = new ArrayList<>();
        List<ProductVariantEntity> variants = variantRepository.findAll();
        
        for (ProductVariantEntity variant : variants) {
            if (variant.getProduct() == null) continue;
            
            // Apply filters
            if (category != null && !category.isEmpty() && 
                !category.equals(variant.getProduct().getCategory().getName())) {
                continue;
            }
            
            if (stockStatus != null && !stockStatus.isEmpty()) {
                int stock = variant.getStock();
                if (stockStatus.equals("in_stock") && stock <= 0) continue;
                if (stockStatus.equals("out_of_stock") && stock > 0) continue;
                if (stockStatus.equals("low_stock") && (stock > 10 || stock <= 0)) continue;
            }
            
            // Apply search query
            boolean matchesQuery = false;
            if (query != null && !query.isEmpty()) {
                String lowerQuery = query.toLowerCase();
                switch (type != null ? type : "all") {
                    case "productId":
                        matchesQuery = String.valueOf(variant.getProduct().getId()).contains(lowerQuery);
                        break;
                    case "variantId":
                        matchesQuery = String.valueOf(variant.getId()).contains(lowerQuery);
                        break;
                    case "sku":
                        matchesQuery = variant.getSku() != null && variant.getSku().toLowerCase().contains(lowerQuery);
                        break;
                    case "name":
                        matchesQuery = variant.getProduct().getName().toLowerCase().contains(lowerQuery);
                        break;
                    case "category":
                        matchesQuery = variant.getProduct().getCategory().getName().toLowerCase().contains(lowerQuery);
                        break;
                    default: // "all"
                        matchesQuery = String.valueOf(variant.getProduct().getId()).contains(lowerQuery) ||
                                      String.valueOf(variant.getId()).contains(lowerQuery) ||
                                      (variant.getSku() != null && variant.getSku().toLowerCase().contains(lowerQuery)) ||
                                      variant.getProduct().getName().toLowerCase().contains(lowerQuery) ||
                                      variant.getProduct().getCategory().getName().toLowerCase().contains(lowerQuery);
                        break;
                }
            } else {
                matchesQuery = true; // No query means show all
            }
            
            if (matchesQuery) {
                // Get sales data from order details
                List<OrderDetailEntity> orderDetails = orderRepository.findOrderDetailsByVariant(variant.getId());
                // Initialize sales tracking variables
                int totalSales = 0;
                int totalProfit = 0;
                java.time.LocalDateTime lastSoldDate = null;
                int quantitySold = 0;
                int totalPurchasePrice = 0;
                for (OrderDetailEntity detail : orderDetails) {
                    if (detail.getOrder() != null && 
                        (detail.getOrder().getStatus() == OrderStatus.COMPLETED ||
                         detail.getOrder().getStatus() == OrderStatus.DELIVERED ||
                         detail.getOrder().getStatus() == OrderStatus.PAID ||
                         detail.getOrder().getStatus() == OrderStatus.ACCEPTED)) {
                        int quantity = detail.getQuantity();
                        int refundedQty = detail.getRefundedQty() != null ? detail.getRefundedQty() : 0;
                        int netQuantity = quantity - refundedQty;
                        if (netQuantity <= 0) continue; // skip fully refunded
                        int sales = netQuantity * detail.getPrice();
                        totalSales += sales;
                        quantitySold += netQuantity;
                        List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                        int cost = 0;
                        int qtyLeft = netQuantity;
                        for (SaleFifoMappingEntity mapping : mappings) {
                            int usedQty = Math.min(mapping.getQuantity(), qtyLeft);
                            cost += usedQty * mapping.getUnitCost();
                            qtyLeft -= usedQty;
                            if (qtyLeft <= 0) break;
                        }
                        totalProfit += sales - cost;
                        if (detail.getOrder().getOrderDate() != null) {
                            if (lastSoldDate == null || detail.getOrder().getOrderDate().isAfter(lastSoldDate)) {
                                lastSoldDate = detail.getOrder().getOrderDate();
                            }
                        }
                    }
                }
                
                // Fallback: If no sales found in order details, try to get from transactions
                if (totalSales == 0) {
                    System.out.println("No sales found in order details, trying transactions for variant " + variant.getId());
                    List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
                    for (TransactionEntity tx : transactions) {
                        if (tx.getOrder() != null && tx.getOrder().getOrderDetails() != null) {
                            for (OrderDetailEntity detail : tx.getOrder().getOrderDetails()) {
                                if (detail.getVariant() != null && detail.getVariant().getId() == variant.getId()) {
                                    int quantity = detail.getQuantity();
                                    int refundedQty = detail.getRefundedQty() != null ? detail.getRefundedQty() : 0;
                                    int netQuantity = quantity - refundedQty;
                                    if (netQuantity <= 0) continue; // skip fully refunded
                                    int sales = netQuantity * detail.getPrice();
                                    totalSales += sales;
                                    quantitySold += netQuantity;
                                    List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                                    int cost = 0;
                                    int qtyLeft = netQuantity;
                                    for (SaleFifoMappingEntity mapping : mappings) {
                                        int usedQty = Math.min(mapping.getQuantity(), qtyLeft);
                                        cost += usedQty * mapping.getUnitCost();
                                        qtyLeft -= usedQty;
                                        if (qtyLeft <= 0) break;
                                    }
                                    totalProfit += sales - cost;
                                    if (tx.getCreatedAt() != null) {
                                        if (lastSoldDate == null || tx.getCreatedAt().isAfter(lastSoldDate)) {
                                            lastSoldDate = tx.getCreatedAt();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                System.out.println("Final totals for variant " + variant.getId() + ": Sales=" + totalSales + ", Profit=" + totalProfit);
                
                // Calculate profit margin
                double profitMargin = totalSales > 0 ? ((double) totalProfit / totalSales) * 100 : 0;
                
                // Calculate average purchase price from purchase history
                int averagePurchasePrice = 0;
                List<PurchaseHistoryEntity> purchaseHistory = purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant);
                if (!purchaseHistory.isEmpty()) {
                    int totalPurchaseAmount = 0;
                    int totalQuantity = 0;
                    for (PurchaseHistoryEntity purchase : purchaseHistory) {
                        totalPurchaseAmount += purchase.getQuantity() * purchase.getPurchasePrice();
                        totalQuantity += purchase.getQuantity();
                    }
                    averagePurchasePrice = totalQuantity > 0 ? totalPurchaseAmount : 0;
                }
                
                // Build variant name
                StringBuilder variantNameBuilder = new StringBuilder();
                if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                    for (int i = 0; i < variant.getAttributeValues().size(); i++) {
                        if (i > 0) variantNameBuilder.append(" - ");
                        variantNameBuilder.append(variant.getAttributeValues().get(i).getValue());
                    }
                } else {
                    variantNameBuilder.append("Default");
                }
                
                String imageUrl = "";
                if (variant.getImages() != null && !variant.getImages().isEmpty()) {
                    imageUrl = variant.getImages().get(0).getImageUrl();
                } else if (variant.getProduct() != null && variant.getProduct().getBasePhotoUrl() != null) {
                    imageUrl = variant.getProduct().getBasePhotoUrl();
                }
                
                ProductSearchResultDTO result = new ProductSearchResultDTO(
                    variant.getProduct().getId(),
                    variant.getId(),
                    variant.getProduct().getName(),
                    variantNameBuilder.toString(),
                    variant.getSku(),
                    variant.getProduct().getCategory().getName(),
                    java.math.BigDecimal.valueOf(variant.getPrice()),
                    java.math.BigDecimal.valueOf(averagePurchasePrice),
                    variant.getStock(),
                    0, // No reorder point field in entity
                    java.math.BigDecimal.valueOf(totalSales),
                    java.math.BigDecimal.valueOf(totalProfit),
                    java.math.BigDecimal.valueOf(profitMargin),
                    lastSoldDate,
                    "", // No supplier info field in entity
                    imageUrl,
                    quantitySold,
                    totalPurchasePrice
                );
                
                results.add(result);
            }
        }
        
        return results;
    }

    @Override
    public ProductSearchResultDTO getProductById(Long productId) {
        List<ProductVariantEntity> variants = variantRepository.findByProductId(productId);
        if (variants.isEmpty()) return null;
        
        // For simplicity, return the first variant
        ProductVariantEntity variant = variants.get(0);
        if (variant.getProduct() == null) return null;
        
        // Calculate sales data (same logic as searchProducts)
        List<OrderDetailEntity> orderDetails = orderRepository.findOrderDetailsByVariant(variant.getId());
        System.out.println("Found " + orderDetails.size() + " order details for variant " + variant.getId());
        int totalSales = 0;
        int totalProfit = 0;
        java.time.LocalDateTime lastSoldDate = null;
        int quantitySold = 0;
        int totalPurchasePrice = 0;
        for (OrderDetailEntity detail : orderDetails) {
            if (detail.getOrder() != null && 
                (detail.getOrder().getStatus() == OrderStatus.COMPLETED ||
                 detail.getOrder().getStatus() == OrderStatus.DELIVERED ||
                 detail.getOrder().getStatus() == OrderStatus.PAID ||
                 detail.getOrder().getStatus() == OrderStatus.ACCEPTED)) {
                int quantity = detail.getQuantity();
                int refundedQty = detail.getRefundedQty() != null ? detail.getRefundedQty() : 0;
                int netQuantity = quantity - refundedQty;
                if (netQuantity <= 0) continue; // skip fully refunded
                int sales = netQuantity * detail.getPrice();
                totalSales += sales;
                quantitySold += netQuantity;
                List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                int cost = 0;
                int qtyLeft = netQuantity;
                for (SaleFifoMappingEntity mapping : mappings) {
                    int usedQty = Math.min(mapping.getQuantity(), qtyLeft);
                    cost += usedQty * mapping.getUnitCost();
                    qtyLeft -= usedQty;
                    if (qtyLeft <= 0) break;
                }
                totalProfit += sales - cost;
                if (detail.getOrder().getOrderDate() != null) {
                    if (lastSoldDate == null || detail.getOrder().getOrderDate().isAfter(lastSoldDate)) {
                        lastSoldDate = detail.getOrder().getOrderDate();
                    }
                }
            }
        }
        
        // Fallback: If no sales found in order details, try to get from transactions
        if (totalSales == 0) {
            System.out.println("No sales found in order details, trying transactions for variant " + variant.getId());
            List<TransactionEntity> transactions = transactionRepository.findByStatus(TransactionStatus.SUCCESS);
            for (TransactionEntity tx : transactions) {
                if (tx.getOrder() != null && tx.getOrder().getOrderDetails() != null) {
                    for (OrderDetailEntity detail : tx.getOrder().getOrderDetails()) {
                        if (detail.getVariant() != null && detail.getVariant().getId() == variant.getId()) {
                            int quantity = detail.getQuantity();
                            int refundedQty = detail.getRefundedQty() != null ? detail.getRefundedQty() : 0;
                            int netQuantity = quantity - refundedQty;
                            if (netQuantity <= 0) continue; // skip fully refunded
                            int sales = netQuantity * detail.getPrice();
                            totalSales += sales;
                            quantitySold += netQuantity;
                            List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                            int cost = 0;
                            int qtyLeft = netQuantity;
                            for (SaleFifoMappingEntity mapping : mappings) {
                                int usedQty = Math.min(mapping.getQuantity(), qtyLeft);
                                cost += usedQty * mapping.getUnitCost();
                                qtyLeft -= usedQty;
                                if (qtyLeft <= 0) break;
                            }
                            totalProfit += sales - cost;
                            if (tx.getCreatedAt() != null) {
                                if (lastSoldDate == null || tx.getCreatedAt().isAfter(lastSoldDate)) {
                                    lastSoldDate = tx.getCreatedAt();
                                }
                            }
                        }
                    }
                }
            }
        }
        
        System.out.println("Final totals for variant " + variant.getId() + ": Sales=" + totalSales + ", Profit=" + totalProfit);
        
        double profitMargin = totalSales > 0 ? ((double) totalProfit / totalSales) * 100 : 0;
        
        // Calculate average purchase price from purchase history
        int averagePurchasePrice = 0;
        List<PurchaseHistoryEntity> purchaseHistory = purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant);
        if (!purchaseHistory.isEmpty()) {
            int totalPurchaseAmount = 0;
            int totalQuantity = 0;
            for (PurchaseHistoryEntity purchase : purchaseHistory) {
                totalPurchaseAmount += purchase.getQuantity() * purchase.getPurchasePrice();
                totalQuantity += purchase.getQuantity();
            }
            averagePurchasePrice = totalQuantity > 0 ? totalPurchaseAmount / totalQuantity : 0;
        }
        
        StringBuilder variantNameBuilder = new StringBuilder();
        if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
            for (int i = 0; i < variant.getAttributeValues().size(); i++) {
                if (i > 0) variantNameBuilder.append(" - ");
                variantNameBuilder.append(variant.getAttributeValues().get(i).getValue());
            }
        } else {
            variantNameBuilder.append("Default");
        }
        
        String imageUrl = "";
        if (variant.getImages() != null && !variant.getImages().isEmpty()) {
            imageUrl = variant.getImages().get(0).getImageUrl();
        } else if (variant.getProduct() != null && variant.getProduct().getBasePhotoUrl() != null) {
            imageUrl = variant.getProduct().getBasePhotoUrl();
        }
         totalPurchasePrice = 0;
        for (OrderDetailEntity detail : orderDetails) {
            if (detail.getOrder() != null &&
                (detail.getOrder().getStatus() == OrderStatus.COMPLETED ||
                 detail.getOrder().getStatus() == OrderStatus.DELIVERED ||
                 detail.getOrder().getStatus() == OrderStatus.PAID ||
                 detail.getOrder().getStatus() == OrderStatus.ACCEPTED)) {
                quantitySold += detail.getQuantity();
            }
        }
        for (PurchaseHistoryEntity purchase : purchaseHistory) {
            totalPurchasePrice += purchase.getQuantity() * purchase.getPurchasePrice();
        }
        
        return new ProductSearchResultDTO(
            variant.getProduct().getId(),
            variant.getId(),
            variant.getProduct().getName(),
            variantNameBuilder.toString(),
            variant.getSku(),
            variant.getProduct().getCategory().getName(),
            java.math.BigDecimal.valueOf(variant.getPrice()),
            java.math.BigDecimal.valueOf(averagePurchasePrice),
            variant.getStock(),
            0, // No reorder point field in entity
            java.math.BigDecimal.valueOf(totalSales),
            java.math.BigDecimal.valueOf(totalProfit),
            java.math.BigDecimal.valueOf(profitMargin),
            lastSoldDate,
            "", // No supplier info field in entity
            imageUrl,
            quantitySold,
            totalPurchasePrice
        );
    }

    @Override
    public List<ProductSalesHistoryDTO> getProductSalesHistory(Long productId, Long variantId) {
        List<ProductSalesHistoryDTO> history = new ArrayList<>();
        
        List<OrderDetailEntity> orderDetails;
        if (variantId != null) {
            orderDetails = orderRepository.findOrderDetailsByVariant(variantId);
        } else {
            orderDetails = orderRepository.findOrderDetailsByProduct(productId);
        }
        
        for (OrderDetailEntity detail : orderDetails) {
            if (detail.getOrder() != null && 
                (detail.getOrder().getStatus() == OrderStatus.COMPLETED ||
                 detail.getOrder().getStatus() == OrderStatus.DELIVERED ||
                 detail.getOrder().getStatus() == OrderStatus.PAID ||
                 detail.getOrder().getStatus() == OrderStatus.ACCEPTED)) {
                ProductVariantEntity variant = detail.getVariant();
                if (variant == null || variant.getProduct() == null) continue;
                
                int sales = detail.getQuantity() * detail.getPrice();
                int cost = 0;
                
                List<SaleFifoMappingEntity> mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                for (SaleFifoMappingEntity mapping : mappings) {
                    cost += mapping.getQuantity() * mapping.getUnitCost();
                }
                
                int profit = sales - cost;
                double profitMargin = sales > 0 ? ((double) profit / sales) * 100 : 0;
                
                StringBuilder variantNameBuilder = new StringBuilder();
                if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                    for (int i = 0; i < variant.getAttributeValues().size(); i++) {
                        if (i > 0) variantNameBuilder.append(" - ");
                        variantNameBuilder.append(variant.getAttributeValues().get(i).getValue());
                    }
                } else {
                    variantNameBuilder.append("Default");
                }
                
                ProductSalesHistoryDTO historyItem = new ProductSalesHistoryDTO(
                    detail.getOrder().getId(),
                    variant.getProduct().getId(),
                    variant.getId(),
                    variant.getProduct().getName(),
                    variantNameBuilder.toString(),
                    variant.getSku(),
                    detail.getQuantity(),
                    java.math.BigDecimal.valueOf(detail.getPrice()),
                    java.math.BigDecimal.valueOf(sales),
                    java.math.BigDecimal.valueOf(cost),
                    java.math.BigDecimal.valueOf(profit),
                    java.math.BigDecimal.valueOf(profitMargin),
                    detail.getOrder().getOrderDate(),
                    detail.getOrder().getUser() != null ? detail.getOrder().getUser().getName() : "Unknown",
                    detail.getOrder().getStatus().toString()
                );
                
                history.add(historyItem);
            }
        }
        
        // Sort by order date descending (most recent first)
        history.sort((a, b) -> b.getOrderDate().compareTo(a.getOrderDate()));
        
        return history;
    }

    @Override
    public byte[] exportProductData(Long productId, String format) {
        ProductSearchResultDTO product = getProductById(productId);
        if (product == null) return new byte[0];
        
        // Simple CSV export for now
        StringBuilder csv = new StringBuilder();
        csv.append("Product ID,Variant ID,Product Name,Variant Name,SKU,Category,Selling Price,Purchase Price,Stock,Reorder Point,Total Sales,Total Profit,Profit Margin,Last Sold Date,Supplier Info\n");
        csv.append(String.format("%d,%d,%s,%s,%s,%s,%.2f,%.2f,%d,%d,%.2f,%.2f,%.2f,%s,%s\n",
            product.getProductId(),
            product.getVariantId(),
            product.getProductName(),
            product.getVariantName(),
            product.getSku(),
            product.getCategory(),
            product.getSellingPrice(),
            product.getPurchasePrice(),
            product.getStockQuantity(),
            product.getReorderPoint(),
            product.getTotalSales(),
            product.getTotalProfit(),
            product.getProfitMargin(),
            product.getLastSoldDate() != null ? product.getLastSoldDate().toString() : "",
            product.getSupplierInfo() != null ? product.getSupplierInfo() : ""
        ));
        
        return csv.toString().getBytes();
    }

    @Override
    public byte[] exportSearchResults(String query, String type, String category, String stockStatus, String format) {
        List<ProductSearchResultDTO> results = searchProducts(query, type, category, stockStatus);
        
        // Simple CSV export for now
        StringBuilder csv = new StringBuilder();
        csv.append("Product ID,Variant ID,Product Name,Variant Name,SKU,Category,Selling Price,Purchase Price,Stock,Reorder Point,Total Sales,Total Profit,Profit Margin,Last Sold Date,Supplier Info\n");
        
        for (ProductSearchResultDTO product : results) {
            csv.append(String.format("%d,%d,%s,%s,%s,%s,%.2f,%.2f,%d,%d,%.2f,%.2f,%.2f,%s,%s\n",
                product.getProductId(),
                product.getVariantId(),
                product.getProductName(),
                product.getVariantName(),
                product.getSku(),
                product.getCategory(),
                product.getSellingPrice(),
                product.getPurchasePrice(),
                product.getStockQuantity(),
                product.getReorderPoint(),
                product.getTotalSales(),
                product.getTotalProfit(),
                product.getProfitMargin(),
                product.getLastSoldDate() != null ? product.getLastSoldDate().toString() : "",
                product.getSupplierInfo() != null ? product.getSupplierInfo() : ""
            ));
        }
        
        return csv.toString().getBytes();
    }

    /**
     * Calculate estimated delivery time based on delivery method and delivery type
     */
    private LocalDateTime calculateEstimatedDeliveryTime(OrderEntity order) {
        // Use order date as base time, or current time if order date is null
        LocalDateTime baseTime = order.getOrderDate() != null ? order.getOrderDate() : LocalDateTime.now();
        
        // Get delivery method and provider
        String deliveryMethod = order.getDeliveryMethod();
        String deliveryProvider = order.getDeliveryProvider();
        
        // Find delivery entity to get delivery type and settings
        DeliveryEntity delivery = deliveryRepository.findByTypeIgnoreCaseAndNameIgnoreCase(
            deliveryMethod, deliveryProvider
        ).orElse(null);
        
        int deliveryDays = 0;
        
        if (delivery != null) {
            // Check if this is a distance-based delivery (Standard) or fixed delivery (Express/Ship)
            if ("Standard".equalsIgnoreCase(deliveryMethod)) {
                // Standard delivery: Calculate based on distance (km)
                double distance = calculateDistance(order);
                System.out.println("Standard delivery - Distance: " + distance + " km");
                
                if (distance <= 10) {
                    deliveryDays = 1; // Same city: 1 day
                } else if (distance <= 50) {
                    deliveryDays = 2; // Nearby city: 2 days
                } else if (distance <= 100) {
                    deliveryDays = 3; // Regional: 3 days
                } else {
                    deliveryDays = 4; // Long distance: 4 days
                }
                System.out.println("Standard delivery - Calculated days: " + deliveryDays);
            } else {
                // Express/Ship delivery: Use fixed days from delivery entity
                String minDelayTime = delivery.getMinDelayTime();
                if (minDelayTime != null && !minDelayTime.isEmpty()) {
                    try {
                        // Parse the delay time (e.g., "2 days", "8 days")
                        deliveryDays = Integer.parseInt(minDelayTime.replaceAll("[^0-9]", ""));
                        System.out.println("Fixed delivery - Days from minDelayTime: " + deliveryDays);
                    } catch (NumberFormatException e) {
                        // Fallback to default values
                        if ("Express".equalsIgnoreCase(deliveryMethod)) {
                            deliveryDays = 2;
                        } else if ("Ship".equalsIgnoreCase(deliveryMethod)) {
                            deliveryDays = 8;
                        } else {
                            deliveryDays = 3;
                        }
                        System.out.println("Fixed delivery - Fallback days: " + deliveryDays);
                    }
                } else {
                    // Fallback to default values if minDelayTime is not set
                    if ("Express".equalsIgnoreCase(deliveryMethod)) {
                        deliveryDays = 2;
                    } else if ("Ship".equalsIgnoreCase(deliveryMethod)) {
                        deliveryDays = 8;
                    } else {
                        deliveryDays = 3;
                    }
                    System.out.println("Fixed delivery - Default fallback days: " + deliveryDays);
                }
            }
        } else {
            // Fallback if delivery entity not found
            if ("Standard".equalsIgnoreCase(deliveryMethod)) {
                deliveryDays = 3; // Default for Standard
            } else if ("Express".equalsIgnoreCase(deliveryMethod)) {
                deliveryDays = 2; // Default for Express
            } else if ("Ship".equalsIgnoreCase(deliveryMethod)) {
                deliveryDays = 8; // Default for Ship
            } else {
                deliveryDays = 3; // General fallback
            }
            System.out.println("Delivery entity not found - Fallback days: " + deliveryDays);
        }
        
        // Add processing time (1 day for order processing)
        int processingDays = 1;
        int totalDays = deliveryDays + processingDays;
        
        System.out.println("Total delivery days (including processing): " + totalDays);
        
        // Calculate estimated delivery date
        LocalDateTime estimatedDate = baseTime.plusDays(totalDays);
        
        // Adjust for weekends (skip weekends)
        while (estimatedDate.getDayOfWeek().getValue() > 5) { // Saturday = 6, Sunday = 7
            estimatedDate = estimatedDate.plusDays(1);
        }
        
        // Set delivery time to 2:00 PM (14:00) for a reasonable delivery window
        LocalDateTime estimatedTime = estimatedDate.toLocalDate().atTime(14, 0);
        
        System.out.println("Final estimated delivery time: " + estimatedTime);
        
        return estimatedTime;
    }
    
    /**
     * Calculate distance between shop and delivery address
     */
    private double calculateDistance(OrderEntity order) {
        try {
            if (order.getDeliveryAddress() == null) {
                return 50.0; // Default distance if no address
            }
            
            // Get shop address from delivery method
            String deliveryMethod = order.getDeliveryMethod();
            String deliveryProvider = order.getDeliveryProvider();
            
            // Find delivery entity to get shop address
            DeliveryEntity delivery = deliveryRepository.findByTypeIgnoreCaseAndNameIgnoreCase(
                deliveryMethod, deliveryProvider
            ).orElse(null);
            
            if (delivery == null || delivery.getShopAddress() == null) {
                return 50.0; // Default distance if no shop address
            }
            
            ShopAddressEntity shopAddress = delivery.getShopAddress();
            if (shopAddress.getLatitude() == null || shopAddress.getLongitude() == null) {
                return 50.0; // Default distance if no coordinates
            }
            
            // Calculate distance using haversine formula
            double userLat = order.getDeliveryAddress().getLatitude();
            double userLng = order.getDeliveryAddress().getLongitude();
            double shopLat = shopAddress.getLatitude();
            double shopLng = shopAddress.getLongitude();
            
            double distance = haversine(userLat, userLng, shopLat, shopLng);
            System.out.println("Distance calculated: " + distance + " km");
            System.out.println("User coordinates: " + userLat + ", " + userLng);
            System.out.println("Shop coordinates: " + shopLat + ", " + shopLng);
            return distance;
            
        } catch (Exception e) {
            return 50.0; // Default distance on error
        }
    }
    
    /**
     * Haversine formula to calculate distance between two points
     */
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Public method to calculate and update estimated delivery time for existing orders
     */
    public void updateEstimatedDeliveryTimeForOrder(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Calculate estimated delivery time regardless of current status
        // This allows updating existing orders that might not have been calculated correctly
        LocalDateTime estimatedDeliveryTime = calculateEstimatedDeliveryTime(order);
        order.setEstimatedDeliveryTime(estimatedDeliveryTime);
        orderRepository.save(order);
        
        System.out.println("Updated estimated delivery time for order " + orderId + " to: " + estimatedDeliveryTime);
    }
} 