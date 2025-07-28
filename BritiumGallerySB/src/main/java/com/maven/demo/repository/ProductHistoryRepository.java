package com.maven.demo.repository;

import com.maven.demo.entity.ProductHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductHistoryRepository extends JpaRepository<ProductHistory, Long> {
    
    // Find all history records for a specific product
    List<ProductHistory> findByProductIdOrderByCreatedAtDesc(Long productId);
    
    // Find all history records by admin ID
    List<ProductHistory> findByAdminIdOrderByCreatedAtDesc(Long adminId);
    
    // Find history records by product ID and action
    List<ProductHistory> findByProductIdAndActionOrderByCreatedAtDesc(Long productId, String action);
    
    // Find history records by variant ID
    List<ProductHistory> findByVariantIdOrderByCreatedAtDesc(Long variantId);
    
    // Find history records by product ID and field name
    List<ProductHistory> findByProductIdAndFieldNameOrderByCreatedAtDesc(Long productId, String fieldName);
} 