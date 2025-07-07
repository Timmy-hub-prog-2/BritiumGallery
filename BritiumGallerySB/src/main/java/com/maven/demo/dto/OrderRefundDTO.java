package com.maven.demo.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class OrderRefundDTO {
    private Long id;
    private String orderNumber;
    private String trackingCode;
    private LocalDateTime orderDate;
    private List<OrderDetailRefundDTO> orderDetails;
    private Integer discountAmount;
    private Integer subtotal;
    private String appliedCouponCode;

    @Data
    public static class OrderDetailRefundDTO {
        private Long id;
        private Integer quantity;  // Original ordered quantity
        private Integer price;     // Price per unit
        private boolean isRefunded;
        private Integer refundedQty;
        private Integer remainingQty;  // quantity - refundedQty
        private VariantRefundDTO variant;
        private Integer actualRefundableAmount;
    }

    @Data
    public static class VariantRefundDTO {
        private Long id;
        private String sku;
        private Map<String, String> attributes;  // e.g., {"Color": "Red", "Size": "XL"}
        private String imageUrl;
        private ProductRefundDTO product;
    }

    @Data
    public static class ProductRefundDTO {
        private Long id;
        private String name;
        private String description;
    }
} 