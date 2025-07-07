package com.maven.demo.dto;

import java.util.List;

public class PendingRefundDTO {
    public Long id;
    public Integer amount;
    public String reason;
    public String requestedAt;
    public Long orderId;
    public String customerName;
    public String type; // FULL or PARTIAL
    public Integer refundQuantity; // for partial
    public Long orderDetailId; // for partial
    public List<RefundedItemDTO> refundedItems; // for partial
    public String status;
    public String proofImageUrl;
    public String trackingCode;
    public String orderStatus;
    public String deliveredAt;
    public String reviewedBy; // admin id who approved/rejected
    public String adminNote; // admin note for rejection
    public String processedAt;

    public static class RefundedItemDTO {
        public Long orderDetailId;
        public String productName;
        public Integer quantity;
        public Integer price;
        public VariantDTO variant;
    }

    public static class VariantDTO {
        public String imageUrl;
        public String sku;
        public java.util.Map<String, String> attributes;
    }
} 