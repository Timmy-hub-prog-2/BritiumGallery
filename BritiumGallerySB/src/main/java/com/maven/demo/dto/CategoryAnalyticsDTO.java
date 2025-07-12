package com.maven.demo.dto;

public class CategoryAnalyticsDTO {
    private String categoryName;
    private int totalSales;
    private int orderCount;
    private int totalProfit;

    public CategoryAnalyticsDTO(String categoryName, int totalSales, int orderCount, int totalProfit) {
        this.categoryName = categoryName;
        this.totalSales = totalSales;
        this.orderCount = orderCount;
        this.totalProfit = totalProfit;
    }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public int getTotalSales() { return totalSales; }
    public void setTotalSales(int totalSales) { this.totalSales = totalSales; }
    public int getOrderCount() { return orderCount; }
    public void setOrderCount(int orderCount) { this.orderCount = orderCount; }
    public int getTotalProfit() { return totalProfit; }
    public void setTotalProfit(int totalProfit) { this.totalProfit = totalProfit; }
} 