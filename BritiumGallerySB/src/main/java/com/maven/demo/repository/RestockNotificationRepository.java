package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.RestockNotificationEntity;
import com.maven.demo.entity.UserEntity;

@Repository
public interface RestockNotificationRepository extends JpaRepository<RestockNotificationEntity, Long> {
    boolean existsByUserAndVariant(UserEntity user, ProductVariantEntity variant);
    java.util.List<RestockNotificationEntity> findByVariantId(Long variantId);
} 