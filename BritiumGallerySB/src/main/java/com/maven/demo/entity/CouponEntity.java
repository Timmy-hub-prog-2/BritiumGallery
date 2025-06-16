package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
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
    private LocalDate startDate;  // Start date of the coupon

    @Column(name = "end_date")
    private LocalDate endDate;
    //   private LocalDate validThrough;

    // Getters and Setters
}