package com.maven.demo.dto;

import lombok.Data;

@Data
public class CustomerTypeStatsDTO {
    private String type;
    private Integer count;
    private Double percentage;
    private Integer totalSpent;
    private Double averageSpent;
    private Integer activeUsers;
} 