package com.maven.demo.repository;

import com.maven.demo.entity.ProductVariantEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM ProductVariantEntity pv WHERE pv.product.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProductVariantEntity p WHERE p.product.id = :productId")
    void deleteByProductId(Long productId);


    List<ProductVariantEntity> findByProductId(long id);
}
