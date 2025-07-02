package com.maven.demo.dto;

import java.time.LocalDateTime;

public class PriceHistoryResponseDTO {
    private Long id;
    private Integer price;
    private LocalDateTime priceDate;
    private Long adminId;
    private String adminName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
    public LocalDateTime getPriceDate() { return priceDate; }
    public void setPriceDate(LocalDateTime priceDate) { this.priceDate = priceDate; }
    public Long getAdminId() { return adminId; }
    public void setAdminId(Long adminId) { this.adminId = adminId; }
    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }
} 