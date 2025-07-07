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

    public BestSellerProductDTO(Long productId, String productName, String variantName,
                               int totalQuantitySold, int totalSales, int totalCost, 
                               int totalDeliveryFee, int totalProfit, double profitMargin) {
        this.productId = productId;
        this.productName = productName;
        this.variantName = variantName;
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
} 