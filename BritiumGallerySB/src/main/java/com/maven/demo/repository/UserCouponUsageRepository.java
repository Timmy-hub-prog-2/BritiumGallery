package com.maven.demo.repository;

import com.maven.demo.entity.UserCouponUsageEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.CouponEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCouponUsageRepository extends JpaRepository<UserCouponUsageEntity, Long> {

    List<UserCouponUsageEntity> findByUserAndCoupon(UserEntity user, CouponEntity coupon);

    long countByUserAndCoupon(UserEntity user, CouponEntity coupon);

    void deleteByCoupon(CouponEntity coupon);

}
