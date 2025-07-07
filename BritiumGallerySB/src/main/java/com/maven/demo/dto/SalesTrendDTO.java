package com.maven.demo.dto;

public class SalesTrendDTO {
    private String period; // e.g. date or week/month label
    private int sales;
    private int cost;
    private int deliveryFee;
    private int profit;
    private int orderCount;

    public SalesTrendDTO(String period, int sales, int cost, int deliveryFee, int profit, int orderCount) {
        this.period = period;
        this.sales = sales;
        this.cost = cost;
        this.deliveryFee = deliveryFee;
        this.profit = profit;
        this.orderCount = orderCount;
    }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public int getSales() { return sales; }
    public void setSales(int sales) { this.sales = sales; }
    public int getCost() { return cost; }
    public void setCost(int cost) { this.cost = cost; }
    public int getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(int deliveryFee) { this.deliveryFee = deliveryFee; }
    public int getProfit() { return profit; }
    public void setProfit(int profit) { this.profit = profit; }
    public int getOrderCount() { return orderCount; }
    public void setOrderCount(int orderCount) { this.orderCount = orderCount; }
} 