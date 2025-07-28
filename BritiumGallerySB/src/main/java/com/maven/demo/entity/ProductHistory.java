package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_history")
@Getter
@Setter
public class ProductHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "action", nullable = false)
    private String action; // "CREATED", "UPDATED", "DELETED", "VARIANT_ADDED", "VARIANT_UPDATED", "VARIANT_DELETED"

    @Column(name = "field_name")
    private String fieldName; // "name", "description", "rating", "brand", "base_photo", "variant_price", "variant_stock", etc.

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 