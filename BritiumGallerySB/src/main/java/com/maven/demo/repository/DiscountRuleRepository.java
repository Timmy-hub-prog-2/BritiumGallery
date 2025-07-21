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
    
    // Find active discount rules for a specific product variant (both rule and event must be active)
    @Query("SELECT r FROM DiscountRule r WHERE r.productVariantId = :variantId AND r.active = true AND r.event.active = true")
    List<DiscountRule> findAllByProductVariantIdAndActive(@Param("variantId") Long variantId);
    
    // Find active discount rules for a specific product (both rule and event must be active)
    @Query("SELECT r FROM DiscountRule r WHERE r.productId = :productId AND r.active = true AND r.event.active = true")
    List<DiscountRule> findActiveProductDiscounts(@Param("productId") Long productId);
    
    // Find active discount rules for a specific category (both rule and event must be active)
    @Query("SELECT r FROM DiscountRule r WHERE r.categoryId = :categoryId AND r.active = true AND r.event.active = true")
    List<DiscountRule> findActiveCategoryDiscounts(@Param("categoryId") Long categoryId);
    
    // Find active discount rules for a specific brand (both rule and event must be active)
    @Query("SELECT r FROM DiscountRule r WHERE r.brandId = :brandId AND r.active = true AND r.event.active = true")
    List<DiscountRule> findActiveBrandDiscounts(@Param("brandId") Long brandId);

    // Find all discount rules for a specific category (active or not)
    List<DiscountRule> findByCategoryId(Long categoryId);

    // Find all discount rules for a specific product (active or not)
    List<DiscountRule> findByProductId(Long productId);

    // Find all discount rules for a specific product variant (active or not)
    List<DiscountRule> findByProductVariantId(Long productVariantId);
}
