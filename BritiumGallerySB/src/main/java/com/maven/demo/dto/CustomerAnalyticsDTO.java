package com.maven.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CustomerAnalyticsDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String customerType;
    private Integer totalSpend;
    private Integer orderCount;
    private Double averageOrderValue;
    private LocalDateTime lastOrderDate;
    private Boolean isOnline;
    private LocalDateTime lastSeenAt;
    private String city;
    private String country;
    private LocalDateTime registrationDate;
    private String status;
} 