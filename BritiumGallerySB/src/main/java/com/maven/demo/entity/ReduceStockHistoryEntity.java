package com.maven.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "reduce_stock_history")
@Getter
@Setter
public class ReduceStockHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariantEntity variant;

    @ManyToOne
    @JoinColumn(name = "purchase_history_id", nullable = false)
    private PurchaseHistoryEntity purchaseHistory;

    @Column(name = "quantity_reduced", nullable = false)
    private Integer quantityReduced;

    @Column(name = "purchase_price_at_reduction", nullable = false)
    private Integer purchasePriceAtReduction;

    @Column(name = "reduction_reason", nullable = false)
    private String reductionReason;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = true)
    private UserEntity admin;

    @Column(name = "reduced_at", nullable = false)
    private LocalDateTime reducedAt;

    @Column(name = "total_stock_before_reduction")
    private Integer totalStockBeforeReduction;

    @Column(name = "total_stock_after_reduction")
    private Integer totalStockAfterReduction;

    @PrePersist
    protected void onCreate() {
        reducedAt = LocalDateTime.now();
    }
}
