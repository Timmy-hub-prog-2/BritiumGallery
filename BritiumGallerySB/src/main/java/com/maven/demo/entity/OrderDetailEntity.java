package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "order_detail")
@Getter
@Setter
public class OrderDetailEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private OrderEntity order;

    @ManyToOne
    private ProductVariantEntity variant;

    private int quantity;
    private Integer price; // unit price at time of sale
    @Column(nullable = false)
    private boolean isRefunded = false;
    @Column(nullable = true)
    private Integer refundedQty;

    @Column(nullable = true)
    private Integer discountPercent; // discount percent applied to this item (e.g., 10 for 10%)

    @Column(nullable = true)
    private Integer discountAmount;  // discount amount (in MMK) applied to this item


}