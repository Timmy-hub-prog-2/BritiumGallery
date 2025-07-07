package com.maven.demo.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.RefundRequestDTO;
import com.maven.demo.entity.OrderDetailEntity;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.OrderStatus;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.RefundRequestEntity;
import com.maven.demo.entity.RefundStatus;
import com.maven.demo.entity.SaleFifoMappingEntity;
import com.maven.demo.entity.TransactionStatus;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.OrderDetailRepository;
import com.maven.demo.repository.OrderRepository;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.repository.PurchaseHistoryRepository;
import com.maven.demo.repository.RefundRequestRepository;
import com.maven.demo.repository.SaleFifoMappingRepository;
import com.maven.demo.repository.TransactionRepository;

@Service
public class RefundService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private RefundRequestRepository refundRequestRepository;

    @Autowired
    private CloudinaryUploadService cloudinaryService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private SaleFifoMappingRepository saleFifoMappingRepository;

    @Autowired
    private PurchaseHistoryRepository purchaseHistoryRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public void createFullOrderRefund(RefundRequestDTO request, MultipartFile proofFile) throws IOException {
        OrderEntity order = orderRepository.findById(request.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found"));

        // Refund eligibility check
        if (!(order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.COMPLETED)) {
            throw new RuntimeException("Refunds are only allowed for orders with status DELIVERED or COMPLETED.");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            LocalDateTime completedAt = order.getOrderDate(); // Replace with completed timestamp if available
            if (completedAt != null && ChronoUnit.DAYS.between(completedAt, LocalDateTime.now()) > 7) {
                throw new RuntimeException("Refunds are only allowed within 7 days after COMPLETED status.");
            }
        }

        // Calculate refund amount
        int refundAmount;
        if (order.getAppliedCouponCode() != null && !order.getAppliedCouponCode().isEmpty() && order.getDiscountAmount() != null && order.getSubtotal() != null) {
            // Coupon used: refund the total after discount (should match what customer paid)
            refundAmount = order.getTotal();
        } else {
            // No coupon: refund the sum of all item prices
            refundAmount = order.getOrderDetails().stream()
                .mapToInt(od -> od.getPrice() * od.getQuantity())
                .sum();
        }

        // Create refund request for full order
        RefundRequestEntity refund = new RefundRequestEntity();
        refund.setOrder(order);
        refund.setOrderDetail(null); // null for full order refund
        refund.setRefundQuantity(null); // null for full order refund
        refund.setAmount(refundAmount);
        refund.setReason(request.getReason());
        refund.setStatus(RefundStatus.REQUESTED);

        // Handle proof file if provided
        if (proofFile != null && !proofFile.isEmpty()) {
            String proofUrl = cloudinaryService.uploadToCloudinary(proofFile, "refund_proofs");
            refund.setProofImageUrl(proofUrl);
        }

        refundRequestRepository.save(refund);
    }

    @Transactional
    public void createPartialRefund(RefundRequestDTO request, MultipartFile[] itemProofs) throws IOException {
        OrderEntity order = orderRepository.findById(request.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found"));

        // Refund eligibility check
        if (!(order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.COMPLETED)) {
            throw new RuntimeException("Refunds are only allowed for orders with status DELIVERED or COMPLETED.");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            LocalDateTime completedAt = order.getOrderDate(); // Replace with completed timestamp if available
            if (completedAt != null && ChronoUnit.DAYS.between(completedAt, LocalDateTime.now()) > 7) {
                throw new RuntimeException("Refunds are only allowed within 7 days after COMPLETED status.");
            }
        }

        boolean usedCoupon = order.getAppliedCouponCode() != null && !order.getAppliedCouponCode().isEmpty() && order.getDiscountAmount() != null && order.getSubtotal() != null;
        int subtotal = order.getSubtotal() != null ? order.getSubtotal() : 0;
        int total = order.getTotal() != null ? order.getTotal() : subtotal;

        // Process each item refund request
        for (int i = 0; i < request.getItems().size(); i++) {
            RefundRequestDTO.RefundItemDTO item = request.getItems().get(i);
            OrderDetailEntity orderDetail = orderDetailRepository.findById(item.getOrderDetailId())
                .orElseThrow(() -> new RuntimeException("Order detail not found"));

            // Validate refund quantity
            int availableQty = orderDetail.getQuantity() - (orderDetail.getRefundedQty() != null ? orderDetail.getRefundedQty() : 0);
            if (item.getQuantity() > availableQty) {
                throw new RuntimeException("Invalid refund quantity for item " + orderDetail.getId());
            }

            // Calculate proportional refund if coupon was used
            int itemRefundAmount;
            if (usedCoupon && subtotal > 0) {
                int itemTotal = orderDetail.getPrice() * item.getQuantity();
                // Proportional refund: (itemTotal / subtotal) * total
                itemRefundAmount = (int)Math.round((itemTotal / (double)subtotal) * total);
            } else {
                itemRefundAmount = orderDetail.getPrice() * item.getQuantity();
            }

            // Create refund request for this item
            RefundRequestEntity refund = new RefundRequestEntity();
            refund.setOrder(order);
            refund.setOrderDetail(orderDetail);
            refund.setRefundQuantity(item.getQuantity());
            refund.setAmount(itemRefundAmount);
            refund.setReason(item.getReason());
            refund.setStatus(RefundStatus.REQUESTED);

            // Handle proof file if provided
            if (itemProofs != null && i < itemProofs.length && !itemProofs[i].isEmpty()) {
                String proofUrl = cloudinaryService.uploadToCloudinary(itemProofs[i], "refund_proofs");
                refund.setProofImageUrl(proofUrl);
            }

            refundRequestRepository.save(refund);

//            // Update order detail's refunded quantity
//            int newRefundedQty = (orderDetail.getRefundedQty() != null ? orderDetail.getRefundedQty() : 0) + item.getQuantity();
//            orderDetail.setRefundedQty(newRefundedQty);
//            orderDetail.setRefunded(newRefundedQty >= orderDetail.getQuantity());
//            orderDetailRepository.save(orderDetail);
        }
    }

    // Add this method for admin to get all pending refund requests
    public List<RefundRequestEntity> getPendingRefundRequests() {
        return refundRequestRepository.findByStatus(RefundStatus.REQUESTED);
    }

    public RefundRequestEntity getRefundById(Long id) {
        return refundRequestRepository.findById(id).orElse(null);
    }

    public List<RefundRequestEntity> getRefundsByOrderId(Long orderId) {
        return refundRequestRepository.findByOrderId(orderId);
    }

    @Transactional
    public void acceptRefund(Long refundId, Integer reviewedBy) {
        RefundRequestEntity refund = refundRequestRepository.findById(refundId)
            .orElseThrow(() -> new RuntimeException("Refund not found"));

        if (refund.getStatus() == RefundStatus.APPROVED) {
            throw new RuntimeException("Refund already accepted");
        }

        if (reviewedBy != null) {
            refund.setReviewedBy(reviewedBy.toString());
        }

        OrderEntity order = refund.getOrder();
        if (refund.getRefundQuantity() != null && refund.getOrderDetail() != null) {
            // Partial refund
            OrderDetailEntity detail = refund.getOrderDetail();
            int newRefundedQty = (detail.getRefundedQty() != null ? detail.getRefundedQty() : 0) + refund.getRefundQuantity();
            detail.setRefundedQty(newRefundedQty);
            detail.setRefunded(newRefundedQty >= detail.getQuantity());
            // Subtract refund amount from subtotal and total
            if (order.getSubtotal() != null) {
                order.setSubtotal(order.getSubtotal() - refund.getAmount());
            }
            if (order.getTotal() != null) {
                order.setTotal(order.getTotal() - refund.getAmount());
            }
            orderDetailRepository.save(detail);
            // Refill variant stock
            var variant = detail.getVariant();
            if (variant != null) {
                variant.setStock(variant.getStock() + refund.getRefundQuantity());
                variantRepository.save(variant);
            }
            // Refill purchase history via SaleFifoMapping
            var mappings = saleFifoMappingRepository.findByOrderDetail(detail);
            for (var mapping : mappings) {
                var purchase = mapping.getPurchaseHistory();
                if (purchase != null) {
                    purchase.setRemainingQuantity(purchase.getRemainingQuantity() + mapping.getQuantity());
                    purchaseHistoryRepository.save(purchase);
                }
            }
            // --- Reduce SaleFifoMapping quantity for refunded items (FIFO) ---
            int qtyToRefund = refund.getRefundQuantity();
            for (SaleFifoMappingEntity mapping : mappings) {
                if (qtyToRefund <= 0) break;
                int used = Math.min(mapping.getQuantity(), qtyToRefund);
                mapping.setQuantity(mapping.getQuantity() - used);
                saleFifoMappingRepository.save(mapping);
                qtyToRefund -= used;
            }
            // Update transaction amount for partial refund
            var transaction = transactionRepository.findByOrder(order).orElse(null);
            if (transaction != null) {
                transaction.setAmount(order.getTotal());
                transactionRepository.save(transaction);
            }
            // After saving the detail, check if all order details are fully refunded
            boolean allRefunded = order.getOrderDetails() != null &&
                order.getOrderDetails().stream().allMatch(od -> {
                    Integer rq = od.getRefundedQty();
                    return rq != null && rq >= od.getQuantity();
                });
            if (allRefunded) {
                order.setStatus(OrderStatus.REFUNDED);
                if (transaction != null) {
                    transaction.setStatus(TransactionStatus.REFUNDED);
                    transaction.setAmount(order.getTotal());
                    transactionRepository.save(transaction);
                }
            }
        } else {
            // Full refund
            if (order.getOrderDetails() != null) {
                for (OrderDetailEntity detail : order.getOrderDetails()) {
                    detail.setRefunded(true);
                    detail.setRefundedQty(detail.getQuantity());
                    orderDetailRepository.save(detail);
                    // Refill variant stock
                    var variant = detail.getVariant();
                    if (variant != null) {
                        variant.setStock(variant.getStock() + detail.getQuantity());
                        variantRepository.save(variant);
                    }
                    // Refill purchase history via SaleFifoMapping
                    var mappings = saleFifoMappingRepository.findByOrderDetail(detail);
                    for (var mapping : mappings) {
                        var purchase = mapping.getPurchaseHistory();
                        if (purchase != null) {
                            purchase.setRemainingQuantity(purchase.getRemainingQuantity() + mapping.getQuantity());
                            purchaseHistoryRepository.save(purchase);
                        }
                    }
                    // --- Reduce SaleFifoMapping quantity for refunded items (FIFO) ---
                    int qtyToRefund = detail.getQuantity();
                    for (SaleFifoMappingEntity mapping : mappings) {
                        if (qtyToRefund <= 0) break;
                        int used = Math.min(mapping.getQuantity(), qtyToRefund);
                        mapping.setQuantity(mapping.getQuantity() - used);
                        saleFifoMappingRepository.save(mapping);
                        qtyToRefund -= used;
                    }
                }
            }
            // Subtract refund amount from subtotal and total
            if (order.getSubtotal() != null) {
                order.setSubtotal(order.getSubtotal() - refund.getAmount());
            }
            if (order.getTotal() != null) {
                order.setTotal(order.getTotal() - refund.getAmount());
            }
            // Set order and transaction status to REFUNDED only if all order details are refunded
            boolean allRefunded = order.getOrderDetails() != null && order.getOrderDetails().stream().allMatch(od -> Boolean.TRUE.equals(od.isRefunded()));
            if (allRefunded) {
                order.setStatus(OrderStatus.REFUNDED);
                var transaction = transactionRepository.findByOrder(order).orElse(null);
                if (transaction != null) {
                    transaction.setStatus(TransactionStatus.REFUNDED);
                    transaction.setAmount(order.getTotal());
                    transactionRepository.save(transaction);
                }
            }
        }
        refund.setStatus(RefundStatus.APPROVED);
        refund.setProcessedAt(LocalDateTime.now());
        refundRequestRepository.save(refund);
        orderRepository.save(order);
        // --- Notification logic for refund accept ---
        UserEntity user = order.getUser();
        if (user != null) {
            String title = "Refund Approved";
            StringBuilder itemsHtml = new StringBuilder();
            itemsHtml.append("<b>Refunded Items:</b><ul>");
            if (refund.getRefundQuantity() != null && refund.getOrderDetail() != null) {
                // Partial refund: only one item
                OrderDetailEntity detail = refund.getOrderDetail();
                ProductVariantEntity variant = detail.getVariant();
                String productName = variant != null && variant.getProduct() != null ? variant.getProduct().getName() : "Unknown Product";
                StringBuilder attrStr = new StringBuilder();
                if (variant != null && variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                    for (var attr : variant.getAttributeValues()) {
                        if (attr.getAttribute() != null && attr.getValue() != null) {
                            if (attrStr.length() > 0) attrStr.append(", ");
                            attrStr.append(attr.getAttribute().getName()).append(": ").append(attr.getValue());
                        }
                    }
                }
                itemsHtml.append("<li>")
                    .append("<b>Product:</b> ").append(productName).append("<br>")
                    .append(attrStr.length() > 0 ? ("<b>Attributes:</b> " + attrStr.toString() + "<br>") : "")
                    .append("<b>Quantity:</b> ").append(refund.getRefundQuantity()).append("<br>")
                    .append("<b>Amount:</b> ").append(String.format("%,d MMK", detail.getPrice() * refund.getRefundQuantity())).append("</li>");
            } else if (order.getOrderDetails() != null) {
                // Full refund: all items
                for (OrderDetailEntity detail : order.getOrderDetails()) {
                    ProductVariantEntity variant = detail.getVariant();
                    String productName = variant != null && variant.getProduct() != null ? variant.getProduct().getName() : "Unknown Product";
                    StringBuilder attrStr = new StringBuilder();
                    if (variant != null && variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                        for (var attr : variant.getAttributeValues()) {
                            if (attr.getAttribute() != null && attr.getValue() != null) {
                                if (attrStr.length() > 0) attrStr.append(", ");
                                attrStr.append(attr.getAttribute().getName()).append(": ").append(attr.getValue());
                            }
                        }
                    }
                    itemsHtml.append("<li>")
                        .append("<b>Product:</b> ").append(productName).append("<br>")
                        .append(attrStr.length() > 0 ? ("<b>Attributes:</b> " + attrStr.toString() + "<br>") : "")
                        .append("<b>Quantity:</b> ").append(detail.getQuantity()).append("<br>")
                        .append("<b>Amount:</b> ").append(String.format("%,d MMK", detail.getPrice() * detail.getQuantity())).append("</li>");
                }
            }
            itemsHtml.append("</ul>");
            String message = String.format(
                    "Good news! Your refund request for order <b>#%s</b> has been <b>approved</b>.<br><br>" +
                            "%s" +
                            "The refund will be processed shortly and returned to your original payment method.<br><br>" +
                            "Thank you for your patience!",
                    order.getTrackingCode(),
                    itemsHtml.toString()
            );
            notificationService.createUserNotification(user, title, message, "REFUND",order.getId());
        }

    }

    @Transactional
    public void rejectRefund(Long refundId, Integer reviewedBy, String reason) {
        RefundRequestEntity refund = refundRequestRepository.findById(refundId)
            .orElseThrow(() -> new RuntimeException("Refund not found"));
        if (refund.getStatus() != RefundStatus.REQUESTED) {
            throw new RuntimeException("Only REQUESTED refunds can be rejected");
        }
        refund.setStatus(RefundStatus.REJECTED);
        if (reviewedBy != null) {
            refund.setReviewedBy(reviewedBy.toString());
        }
        if (reason != null) {
            refund.setAdminNote(reason);
        }
        refund.setProcessedAt(LocalDateTime.now());
        refundRequestRepository.save(refund);
        // --- Notification logic for refund reject ---
        OrderEntity order = refund.getOrder();
        UserEntity user = order != null ? order.getUser() : null;
        if (user != null) {
            String title = "Refund Rejected";
            StringBuilder message = new StringBuilder();
            message.append(String.format(
                "Unfortunately, your refund request for order <b>#%s</b> has been <b>rejected</b> and will not be processed.<br><br>",
                order.getTrackingCode()
            ));
            if (reason != null && !reason.isEmpty()) {
                message.append("<div style='color: #d32f2f !important; font-weight: bold; margin: 8px 0;'>");
                message.append("Refund Rejection Reason:");
                message.append("<span style='font-weight: normal;'>" + reason + "</span>");
                message.append("</div><br>");
            }
            message.append("If you believe this was a mistake or need help, please contact our <b>support team</b>.");
            notificationService.createUserNotification(user, title, message.toString(), "REFUND", order.getId());
        }
    }

    public List<RefundRequestEntity> getAllRefunds() {
        return refundRequestRepository.findAll();
    }

    public List<RefundRequestEntity> getRefundsByUserId(Long userId) {
        return refundRequestRepository.findByOrder_User_Id(userId);
    }
} 