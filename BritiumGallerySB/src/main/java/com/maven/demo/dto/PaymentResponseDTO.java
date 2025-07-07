package com.maven.demo.dto;

import lombok.Data;

@Data
public class PaymentResponseDTO {
    private Long orderId;
    private String paymentMethod;
    private String paymentStatus;
    private String message;
    private String transactionId;
    private boolean success;
} 