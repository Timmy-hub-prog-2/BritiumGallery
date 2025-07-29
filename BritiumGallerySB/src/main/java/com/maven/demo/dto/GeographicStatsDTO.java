package com.maven.demo.dto;

import lombok.Data;

@Data
public class GeographicStatsDTO {
    private String location;
    private Integer count;
    private Double percentage;
    private Integer totalSpent;
    private Double averageSpent;
} 