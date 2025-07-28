package com.maven.demo.dto;

import java.time.LocalDateTime;

public class ProductHistoryDTO {
    private Long id;
    private Long productId;
    private Long adminId;
    private String adminName;
    private String action;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;

    // Constructors
    public ProductHistoryDTO() {}

    public ProductHistoryDTO(Long id, Long productId, Long adminId, String adminName, 
                           String action, String fieldName, String oldValue, String newValue, 
                           LocalDateTime createdAt) {
        this.id = id;
        this.productId = productId;
        this.adminId = adminId;
        this.adminName = adminName;
        this.action = action;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 