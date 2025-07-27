package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryDTO {
    private Integer id;
    
    // New fields
    private String deliveryType; // standard, express, ship, etc.
    private String speedType; // normal, fast, etc.
    private Integer baseDelayDays; // Base delay in days
    private Double baseDelayHours; // Base delay in hours
    private Double speedKmHr; // Speed in km/hr
    private Integer feePerKm; // Fee per km in MMK
    private Integer baseFee; // Base fee in MMK
    private Integer maxFee; // Maximum fee in MMK
    
    // Legacy fields for backward compatibility
    private String type;
    private String name;
    private Long adminId;
    private Integer feesPer1km;
    private String fixAmount;
    private String minDelayTime;
    private Long shopUserId;
}
