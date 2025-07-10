package com.maven.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.maven.demo.entity.DiscountRule;

public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Long> {
    List<DiscountRule> findByEventId(Long eventId);
    
    @Modifying
    @Query("DELETE FROM DiscountRule r WHERE r.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
    
    // Find active discount rules for a specific product variant
    @Query("SELECT r FROM DiscountRule r WHERE r.productVariantId = :variantId AND r.event.active = true")
    List<DiscountRule> findAllByProductVariantIdAndActive(@Param("variantId") Long variantId);
    
    // Find active discount rules for a specific product
    @Query("SELECT r FROM DiscountRule r WHERE r.productId = :productId AND r.event.active = true")
    List<DiscountRule> findActiveProductDiscounts(@Param("productId") Long productId);
    
    // Find active discount rules for a specific category
    @Query("SELECT r FROM DiscountRule r WHERE r.categoryId = :categoryId AND r.event.active = true")
    List<DiscountRule> findActiveCategoryDiscounts(@Param("categoryId") Long categoryId);
    
    // Find active discount rules for a specific brand
    @Query("SELECT r FROM DiscountRule r WHERE r.brandId = :brandId AND r.event.active = true")
    List<DiscountRule> findActiveBrandDiscounts(@Param("brandId") Long brandId);
}
