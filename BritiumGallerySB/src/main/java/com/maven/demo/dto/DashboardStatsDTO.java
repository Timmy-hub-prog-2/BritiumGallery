package com.maven.demo.dto;

public class DashboardStatsDTO {
    private int totalSales;
    private int totalCost;
    private int totalDeliveryFee;
    private int profit;
    private int transactionCount;
    private int totalPurchaseAmount;
    private int normalCustomerCount;
    private int loyaltyCustomerCount;
    private int vipCustomerCount;

    public DashboardStatsDTO(int totalSales, int totalCost, int totalDeliveryFee, int profit, int transactionCount, int totalPurchaseAmount, int normalCustomerCount, int loyaltyCustomerCount, int vipCustomerCount) {
        this.totalSales = totalSales;
        this.totalCost = totalCost;
        this.totalDeliveryFee = totalDeliveryFee;
        this.profit = profit;
        this.transactionCount = transactionCount;
        this.totalPurchaseAmount = totalPurchaseAmount;
        this.normalCustomerCount = normalCustomerCount;
        this.loyaltyCustomerCount = loyaltyCustomerCount;
        this.vipCustomerCount = vipCustomerCount;
    }

    public int getTotalSales() { return totalSales; }
    public void setTotalSales(int totalSales) { this.totalSales = totalSales; }

    public int getTotalCost() { return totalCost; }
    public void setTotalCost(int totalCost) { this.totalCost = totalCost; }

    public int getTotalDeliveryFee() { return totalDeliveryFee; }
    public void setTotalDeliveryFee(int totalDeliveryFee) { this.totalDeliveryFee = totalDeliveryFee; }

    public int getProfit() { return profit; }
    public void setProfit(int profit) { this.profit = profit; }

    public int getTransactionCount() { return transactionCount; }
    public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }

    public int getTotalPurchaseAmount() { return totalPurchaseAmount; }
    public void setTotalPurchaseAmount(int totalPurchaseAmount) { this.totalPurchaseAmount = totalPurchaseAmount; }

    public int getNormalCustomerCount() { return normalCustomerCount; }
    public void setNormalCustomerCount(int normalCustomerCount) { this.normalCustomerCount = normalCustomerCount; }

    public int getLoyaltyCustomerCount() { return loyaltyCustomerCount; }
    public void setLoyaltyCustomerCount(int loyaltyCustomerCount) { this.loyaltyCustomerCount = loyaltyCustomerCount; }

    public int getVipCustomerCount() { return vipCustomerCount; }
    public void setVipCustomerCount(int vipCustomerCount) { this.vipCustomerCount = vipCustomerCount; }
} 