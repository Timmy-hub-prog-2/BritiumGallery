package com.maven.demo.entity;

public enum RefundStatus {
    REQUESTED,    // Initial state when refund is requested
    APPROVED,     // Refund request is approved
    REJECTED,     // Refund request is rejected
    PROCESSING,   // Refund is being processed (e.g., money transfer)
    COMPLETED     // Refund has been completed
}
