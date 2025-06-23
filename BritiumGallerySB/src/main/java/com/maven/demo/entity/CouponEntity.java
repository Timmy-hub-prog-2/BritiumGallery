package com.maven.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "coupon")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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

    @Column(name = "end_date", nullable = true)
    private LocalDate endDate;

    @JsonIgnore
    @OneToMany(mappedBy = "coupon")
    private List<UserCouponUsageEntity> usages;

    @JsonIgnore
    @OneToMany(mappedBy = "coupon")
    private List<CouponCustomerTypeEntity> couponRules;

    public boolean isExpired() {
        return endDate != null && endDate.isBefore(LocalDate.now());
    }
}
