package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.maven.demo.entity.PurchaseHistoryEntity;
import com.maven.demo.entity.ProductVariantEntity;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseHistoryRepository extends JpaRepository<PurchaseHistoryEntity, Long> {
    Optional<PurchaseHistoryEntity> findTopByVariantIdOrderByPurchaseDateDesc(Long variantId);
    List<PurchaseHistoryEntity> findByVariantOrderByPurchaseDateDesc(ProductVariantEntity variant);
} 