package com.maven.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "delivery")
public class DeliveryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "delivery_type")
    private String deliveryType; // standard, express, ship, etc.

    @Column(name = "speed_type")
    private String speedType; // normal, fast, etc.

    @Column(name = "base_delay_days")
    private Integer baseDelayDays; // Base delay in days

    @Column(name = "base_delay_hours")
    private Double baseDelayHours; // Base delay in hours

    @Column(name = "speed_km_hr")
    private Double speedKmHr; // Speed in km/hr

    @Column(name = "fee_per_km")
    private Integer feePerKm; // Fee per km in MMK

    @Column(name = "base_fee")
    private Integer baseFee; // Base fee in MMK

    @Column(name = "max_fee")
    private Integer maxFee; // Maximum fee in MMK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false) // FK column
    private UserEntity admin;

    // Legacy fields for backward compatibility (can be removed later)
    private String type;
    private String name;
    private Integer feesPer1km;
    private String fixAmount;
    
    @Column(name = "min_delay_time")
    private String minDelayTime;
}
