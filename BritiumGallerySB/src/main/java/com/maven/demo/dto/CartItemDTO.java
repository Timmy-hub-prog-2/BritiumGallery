package com.maven.demo.dto;

public class CartItemDTO {
    private Long variantId;
    private Integer quantity;
    private Integer price;
    // getters and setters
    public Long getVariantId() { return variantId; }
    public void setVariantId(Long variantId) { this.variantId = variantId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
} 