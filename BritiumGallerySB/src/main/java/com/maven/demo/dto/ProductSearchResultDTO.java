package com.maven.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductSearchResultDTO {
    private Long productId;
    private Long variantId;
    private String productName;
    private String variantName;
    private String sku;
    private String category;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private Integer stockQuantity;
    private Integer reorderPoint;
    private BigDecimal totalSales;
    private BigDecimal totalProfit;
    private BigDecimal profitMargin;
    private LocalDateTime lastSoldDate;
    private String supplierInfo;
    private String productImage;
    private String imageUrl;
    private Integer quantitySold;
    private Integer totalPurchasePrice;

    // Constructors
    public ProductSearchResultDTO() {}

    public ProductSearchResultDTO(Long productId, Long variantId, String productName, String variantName, 
                                 String sku, String category, BigDecimal sellingPrice, BigDecimal purchasePrice,
                                 Integer stockQuantity, Integer reorderPoint, BigDecimal totalSales, 
                                 BigDecimal totalProfit, BigDecimal profitMargin, LocalDateTime lastSoldDate,
                                 String supplierInfo, String productImage) {
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.variantName = variantName;
        this.sku = sku;
        this.category = category;
        this.sellingPrice = sellingPrice;
        this.purchasePrice = purchasePrice;
        this.stockQuantity = stockQuantity;
        this.reorderPoint = reorderPoint;
        this.totalSales = totalSales;
        this.totalProfit = totalProfit;
        this.profitMargin = profitMargin;
        this.lastSoldDate = lastSoldDate;
        this.supplierInfo = supplierInfo;
        this.productImage = productImage;
    }

    public ProductSearchResultDTO(Long productId, Long variantId, String productName, String variantName, 
                                 String sku, String category, BigDecimal sellingPrice, BigDecimal purchasePrice,
                                 Integer stockQuantity, Integer reorderPoint, BigDecimal totalSales, 
                                 BigDecimal totalProfit, BigDecimal profitMargin, LocalDateTime lastSoldDate,
                                 String supplierInfo, String imageUrl, Integer quantitySold, Integer totalPurchasePrice) {
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.variantName = variantName;
        this.sku = sku;
        this.category = category;
        this.sellingPrice = sellingPrice;
        this.purchasePrice = purchasePrice;
        this.stockQuantity = stockQuantity;
        this.reorderPoint = reorderPoint;
        this.totalSales = totalSales;
        this.totalProfit = totalProfit;
        this.profitMargin = profitMargin;
        this.lastSoldDate = lastSoldDate;
        this.supplierInfo = supplierInfo;
        this.imageUrl = imageUrl;
        this.quantitySold = quantitySold;
        this.totalPurchasePrice = totalPurchasePrice;
    }

    // Getters and Setters
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Integer getReorderPoint() {
        return reorderPoint;
    }

    public void setReorderPoint(Integer reorderPoint) {
        this.reorderPoint = reorderPoint;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    public void setTotalProfit(BigDecimal totalProfit) {
        this.totalProfit = totalProfit;
    }

    public BigDecimal getProfitMargin() {
        return profitMargin;
    }

    public void setProfitMargin(BigDecimal profitMargin) {
        this.profitMargin = profitMargin;
    }

    public LocalDateTime getLastSoldDate() {
        return lastSoldDate;
    }

    public void setLastSoldDate(LocalDateTime lastSoldDate) {
        this.lastSoldDate = lastSoldDate;
    }

    public String getSupplierInfo() {
        return supplierInfo;
    }

    public void setSupplierInfo(String supplierInfo) {
        this.supplierInfo = supplierInfo;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String productImage) {
        this.productImage = productImage;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(Integer quantitySold) {
        this.quantitySold = quantitySold;
    }

    public Integer getTotalPurchasePrice() {
        return totalPurchasePrice;
    }

    public void setTotalPurchasePrice(Integer totalPurchasePrice) {
        this.totalPurchasePrice = totalPurchasePrice;
    }
} 