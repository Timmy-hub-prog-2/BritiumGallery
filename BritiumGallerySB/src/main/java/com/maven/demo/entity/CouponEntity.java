package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Table(name = "coupon")
@Entity
public class CouponEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String type;
    private String discount;
    private String status;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @OneToMany(mappedBy = "coupon")
    private List<UserCouponUsageEntity> usages;

    @OneToMany(mappedBy = "coupon")
    private List<CouponCustomerTypeEntity> couponRules;
}