package com.maven.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "purchase_history")
@Getter
@Setter
public class PurchaseHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer quantity;
    private Integer remainingQuantity;
    private Integer purchasePrice;
    private LocalDateTime purchaseDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "variant_id")
    private ProductVariantEntity variant;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = true)
    private UserEntity admin;

    @OneToMany(mappedBy = "purchaseHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<SaleFifoMappingEntity> saleFifoMappings = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "purchaseHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ReduceStockHistoryEntity> reduceStockHistories = new java.util.ArrayList<>();
}
