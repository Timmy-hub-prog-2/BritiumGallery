package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "refund_requests")
@Data
@NoArgsConstructor
public class RefundRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Full order or specific item refund
    @ManyToOne(optional = false)
    private OrderEntity order;

    @ManyToOne(optional = true)
    private OrderDetailEntity orderDetail; // null if it's a full order refund

    // Quantity being refunded
    @Column(nullable = true)
    private Integer refundQuantity; // nullable for full-order refund

    // Total amount to be refunded
    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    private String reason;

    private String proofImageUrl;

    @Enumerated(EnumType.STRING)
    private RefundStatus status = RefundStatus.REQUESTED;

    private String reviewedBy;

    private String adminNote;

    private LocalDateTime requestedAt = LocalDateTime.now();

    private LocalDateTime processedAt;
}
