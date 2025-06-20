package com.maven.demo.repository;

import com.maven.demo.entity.CouponCustomerTypeEntity;
import com.maven.demo.entity.CouponEntity;
import com.maven.demo.entity.CustomerTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CouponCustomerTypeRepository extends JpaRepository<CouponCustomerTypeEntity, Long> {

    Optional<CouponCustomerTypeEntity> findByCouponAndCustomerType(CouponEntity coupon, CustomerTypeEntity customerType);
}
