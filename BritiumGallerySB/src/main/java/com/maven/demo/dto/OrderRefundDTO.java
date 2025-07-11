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
    private Integer total;
    private Integer deliveryFee;
    private String appliedCouponCode;
    private String discountType;
    private String discountValue;

    public Integer getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(Integer deliveryFee) { this.deliveryFee = deliveryFee; }
    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }
    public String getDiscountValue() { return discountValue; }
    public void setDiscountValue(String discountValue) { this.discountValue = discountValue; }

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
        private Integer discountAmount;    // Discount per item
        private Integer discountPercent;   // Discount percent per item
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