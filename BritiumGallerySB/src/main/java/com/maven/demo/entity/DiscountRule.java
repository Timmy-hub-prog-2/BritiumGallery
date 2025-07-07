package com.maven.demo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "discount_rule")
@Getter
@Setter
public class DiscountRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    @JsonBackReference
    private DiscountEvent event;

    @Column(name = "category_id")
    private Long categoryId;
    
    @Column(name = "product_variant_id")
    private Long productVariantId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "discount_percent", nullable = false)
    private Double discountPercent;
    
    @Column(name = "admin_id", nullable = false)
    private Long adminId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "brand_id")
    private Long brandId;
    
    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DiscountRuleAttributeOption> attributeOptions = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
