package com.maven.demo.repository;

import com.maven.demo.entity.CouponEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<CouponEntity, Long> {
    void deleteByCode(String code);
    Optional<CouponEntity> findByCode(String code);

    boolean existsByCode(String code);

    Optional<CouponEntity> findByCodeIgnoreCase(String code);

}