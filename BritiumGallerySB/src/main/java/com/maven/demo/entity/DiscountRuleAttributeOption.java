package com.maven.demo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "discount_rule_attribute_option")
@Getter
@Setter
public class DiscountRuleAttributeOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rule_id", nullable = false)
    @JsonBackReference
    private DiscountRule rule;

    @Column(name = "attribute_option_id", nullable = false)
    private Long attributeOptionId;
}