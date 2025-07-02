package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.maven.demo.entity.ProductVariantPriceHistoryEntity;
import com.maven.demo.entity.ProductVariantEntity;
import java.util.List;

@Repository
public interface ProductVariantPriceHistoryRepository extends JpaRepository<ProductVariantPriceHistoryEntity, Long> {
    List<ProductVariantPriceHistoryEntity> findByVariantOrderByPriceDateDesc(ProductVariantEntity variant);
}
