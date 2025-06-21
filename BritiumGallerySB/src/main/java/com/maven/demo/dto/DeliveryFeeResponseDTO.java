package com.maven.demo.dto;

import lombok.Data;

@Data
public class DeliveryFeeResponseDTO {
    private double distance;
    private double fee;
    private String estimatedTime;
}