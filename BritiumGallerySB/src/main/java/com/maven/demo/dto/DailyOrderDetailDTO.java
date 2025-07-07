package com.maven.demo.dto;

import java.time.LocalDateTime;

public class DailyOrderDetailDTO {
    private Long orderId;
    private String trackingCode;
    private String customerName;
    private int sales;
    private int cost;
    private int deliveryFee;
    private int profit;
    private LocalDateTime orderDate;
    private String status;

    public DailyOrderDetailDTO(Long orderId, String trackingCode, String customerName, 
                              int sales, int cost, int deliveryFee, int profit, 
                              LocalDateTime orderDate, String status) {
        this.orderId = orderId;
        this.trackingCode = trackingCode;
        this.customerName = customerName;
        this.sales = sales;
        this.cost = cost;
        this.deliveryFee = deliveryFee;
        this.profit = profit;
        this.orderDate = orderDate;
        this.status = status;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    
    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public int getSales() { return sales; }
    public void setSales(int sales) { this.sales = sales; }
    
    public int getCost() { return cost; }
    public void setCost(int cost) { this.cost = cost; }
    
    public int getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(int deliveryFee) { this.deliveryFee = deliveryFee; }
    
    public int getProfit() { return profit; }
    public void setProfit(int profit) { this.profit = profit; }
    
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
} 