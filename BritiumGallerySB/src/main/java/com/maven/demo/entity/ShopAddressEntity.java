package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Fetch;

@Entity
@Table(name = "shop_address")
@Data
public class ShopAddressEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String city;
    private String township;
    private String street;
    private String houseNumber;
    private String wardName;
    private Double latitude;
    private Double longitude;

    private String state;
    private String country;
    private String postalCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(name = "main_address")
    private boolean mainAddress;
}