package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "shipping_returns_policy")
@Getter
@Setter
public class ShippingReturnsPolicyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title; // e.g., "Shipping Information", "Returns"
    private String content; // full HTML/text content
    private Integer displayOrder; // for sorting
}
