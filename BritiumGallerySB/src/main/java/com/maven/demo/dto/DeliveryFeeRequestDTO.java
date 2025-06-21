package com.maven.demo.dto;

import lombok.Data;
@Data
public class DeliveryFeeRequestDTO {
    private Long userId;       // User's ID
    private Long deliveryId;   // Shop address ID (ensure it's Long)
    private String method;
    private String name;// Delivery method (Standard, Express, Ship)
}
