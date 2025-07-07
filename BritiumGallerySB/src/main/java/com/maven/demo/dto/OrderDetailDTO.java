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

    public OrderDetailVariantDTO getVariant() { return variant; }
    public void setVariant(OrderDetailVariantDTO variant) { this.variant = variant; }
} 