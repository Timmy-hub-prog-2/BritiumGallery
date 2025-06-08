package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "VariantAttributeValue")
public class VariantAttributeValueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "product_variant_id")
    private ProductVariantEntity productVariant;

    @ManyToOne
    @JoinColumn(name = "product_attribute_id")
    private AttributeEntity attribute;

    @Column(name = "value")
    private String value;



}
