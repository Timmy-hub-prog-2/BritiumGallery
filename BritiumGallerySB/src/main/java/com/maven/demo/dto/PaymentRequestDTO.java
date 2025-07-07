package com.maven.demo.dto;

import lombok.Data;

@Data
public class PaymentRequestDTO {
    private Long orderId;
    private String paymentMethod;
    private String cardNumber;
    private String expiry;
    private String cvv;
    private String receiptImageUrl; // For QR code payments
    private String paymentStatus;
} 