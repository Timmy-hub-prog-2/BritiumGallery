package com.maven.demo.repository;

import com.maven.demo.entity.CouponCustomerTypeEntity;
import com.maven.demo.entity.CouponEntity;
import com.maven.demo.entity.CustomerTypeEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CouponCustomerTypeRepository extends JpaRepository<CouponCustomerTypeEntity, Long> {

    Optional<CouponCustomerTypeEntity> findByCouponAndCustomerType(CouponEntity coupon, CustomerTypeEntity customerType);

    List<CouponCustomerTypeEntity> findByCoupon(CouponEntity coupon);

    @Modifying
    @Query("DELETE FROM CouponCustomerTypeEntity c WHERE c.coupon.id = :couponId")
    void deleteByCouponId(@Param("couponId") Long couponId);

}
