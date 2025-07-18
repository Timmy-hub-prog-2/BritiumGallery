package com.maven.demo.dto;

public class BestSellerProductDTO {
    private Long productId;
    private String productName;
    private String variantName;
    private int totalQuantitySold;
    private int totalSales;
    private int totalCost;
    private int totalDeliveryFee;
    private int totalProfit;
    private double profitMargin;
    private String basePhotoUrl;
    private Long variantId;
    private String sku;
    private String imageUrl;
    private String variantAttributes;

    public BestSellerProductDTO(Long productId, String productName, Long variantId, String variantName, String variantAttributes, String sku, String imageUrl, int totalQuantitySold, int totalSales, int totalCost, int totalDeliveryFee, int totalProfit, double profitMargin) {
        this.productId = productId;
        this.productName = productName;
        this.variantId = variantId;
        this.variantName = variantName;
        this.variantAttributes = variantAttributes;
        this.sku = sku;
        this.imageUrl = imageUrl;
        this.totalQuantitySold = totalQuantitySold;
        this.totalSales = totalSales;
        this.totalCost = totalCost;
        this.totalDeliveryFee = totalDeliveryFee;
        this.totalProfit = totalProfit;
        this.profitMargin = profitMargin;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    
    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }
    
    public int getTotalQuantitySold() { return totalQuantitySold; }
    public void setTotalQuantitySold(int totalQuantitySold) { this.totalQuantitySold = totalQuantitySold; }
    
    public int getTotalSales() { return totalSales; }
    public void setTotalSales(int totalSales) { this.totalSales = totalSales; }
    
    public int getTotalCost() { return totalCost; }
    public void setTotalCost(int totalCost) { this.totalCost = totalCost; }
    
    public int getTotalDeliveryFee() { return totalDeliveryFee; }
    public void setTotalDeliveryFee(int totalDeliveryFee) { this.totalDeliveryFee = totalDeliveryFee; }
    
    public int getTotalProfit() { return totalProfit; }
    public void setTotalProfit(int totalProfit) { this.totalProfit = totalProfit; }
    
    public double getProfitMargin() { return profitMargin; }
    public void setProfitMargin(double profitMargin) { this.profitMargin = profitMargin; }

    public String getBasePhotoUrl() { return basePhotoUrl; }
    public void setBasePhotoUrl(String basePhotoUrl) { this.basePhotoUrl = basePhotoUrl; }

    public Long getVariantId() { return variantId; }
    public void setVariantId(Long variantId) { this.variantId = variantId; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getVariantAttributes() { return variantAttributes; }
    public void setVariantAttributes(String variantAttributes) { this.variantAttributes = variantAttributes; }
} 