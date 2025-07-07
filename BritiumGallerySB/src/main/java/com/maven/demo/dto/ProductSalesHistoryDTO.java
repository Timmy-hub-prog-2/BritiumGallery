package com.maven.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductSalesHistoryDTO {
    private Long orderId;
    private Long productId;
    private Long variantId;
    private String productName;
    private String variantName;
    private String sku;
    private Integer quantitySold;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private BigDecimal costPrice;
    private BigDecimal profit;
    private BigDecimal profitMargin;
    private LocalDateTime orderDate;
    private String customerName;
    private String orderStatus;

    // Constructors
    public ProductSalesHistoryDTO() {}

    public ProductSalesHistoryDTO(Long orderId, Long productId, Long variantId, String productName, 
                                 String variantName, String sku, Integer quantitySold, BigDecimal unitPrice,
                                 BigDecimal totalAmount, BigDecimal costPrice, BigDecimal profit, 
                                 BigDecimal profitMargin, LocalDateTime orderDate, String customerName,
                                 String orderStatus) {
        this.orderId = orderId;
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.variantName = variantName;
        this.sku = sku;
        this.quantitySold = quantitySold;
        this.unitPrice = unitPrice;
        this.totalAmount = totalAmount;
        this.costPrice = costPrice;
        this.profit = profit;
        this.profitMargin = profitMargin;
        this.orderDate = orderDate;
        this.customerName = customerName;
        this.orderStatus = orderStatus;
    }

    // Getters and Setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getVariantName() {
        return variantName;
    }

    public void setVariantName(String variantName) {
        this.variantName = variantName;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Integer getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(Integer quantitySold) {
        this.quantitySold = quantitySold;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(BigDecimal costPrice) {
        this.costPrice = costPrice;
    }

    public BigDecimal getProfit() {
        return profit;
    }

    public void setProfit(BigDecimal profit) {
        this.profit = profit;
    }

    public BigDecimal getProfitMargin() {
        return profitMargin;
    }

    public void setProfitMargin(BigDecimal profitMargin) {
        this.profitMargin = profitMargin;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }
} 