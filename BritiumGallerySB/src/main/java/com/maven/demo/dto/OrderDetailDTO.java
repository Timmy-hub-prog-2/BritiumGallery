package com.maven.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderDetailDTO {
    private Long id;
    private int quantity;
    private Integer price;
    private Long variantId;
    private OrderDetailVariantDTO variant;
    @JsonProperty("isRefunded")
    private boolean isRefunded;
    private Integer refundedQty;
    private Integer discountPercent; // discount percent applied to this item (e.g., 10 for 10%)
    private Integer discountAmount;  // discount amount (in MMK) applied to this item

    public OrderDetailVariantDTO getVariant() { return variant; }
    public void setVariant(OrderDetailVariantDTO variant) { this.variant = variant; }
} 