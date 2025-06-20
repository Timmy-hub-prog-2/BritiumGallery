package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "customer_type")
@Getter
@Setter
public class CustomerTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 45, nullable = false)
    private String type;  // Normal, Loyalty, VIP

    @OneToMany(mappedBy = "customerType")
    private List<UserEntity> users;

    @OneToMany(mappedBy = "customerType")
    private List<CouponCustomerTypeEntity> couponRules;
}