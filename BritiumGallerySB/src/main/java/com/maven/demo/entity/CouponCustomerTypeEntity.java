package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "coupon_has_customer_type")
@Getter
@Setter
public class CouponCustomerTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "coupon_id", nullable = false)
    private CouponEntity coupon;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_type_id", nullable = false)
    private CustomerTypeEntity customerType;

    @Column(name = "times")
    private int times;
}
