package com.maven.demo.entity;

import jakarta.persistence.*;
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

    private String type;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false) // FK column
    private UserEntity admin;

    private Integer feesPer1km;
    private String fixAmount;
    private String minDelayTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_address_id")  // This will create a foreign key column in `delivery` table
    private ShopAddressEntity shopAddress;

}
