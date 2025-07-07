package com.maven.demo.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "transactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the order
    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    // How much the user claims they paid
    @Column(nullable = false)
    private Integer amount;

    // e.g., KBZ_PAY, WAVE_MONEY, CASH, BANK_TRANSFER
    @Column(length = 50, nullable = false)
    private String paymentMethod;

    // Order marked as paid by user, but this stays pending until confirmed
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING;

    // When user submitted the payment
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Optional: Payment confirmation timestamp
    private LocalDateTime confirmedAt;

    // Optional: uploaded proof (e.g., image URL to Cloudinary/S3)
    private String proofImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "Reviewed_by")
    private UserEntity user;

    // Optional: notes (e.g. “Slip blurry”, “Transfer mismatch”)
    @Column(length = 1000)
    private String notes;
}
