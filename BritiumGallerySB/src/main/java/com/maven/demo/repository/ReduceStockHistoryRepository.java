package com.maven.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.ReduceStockHistoryEntity;

@Repository
public interface ReduceStockHistoryRepository extends JpaRepository<ReduceStockHistoryEntity, Long> {
    
    @Query("SELECT r FROM ReduceStockHistoryEntity r WHERE r.variant.id = :variantId ORDER BY r.reducedAt DESC")
    List<ReduceStockHistoryEntity> findByVariantIdOrderByReducedAtDesc(@Param("variantId") Long variantId);
    
    @Query("SELECT r FROM ReduceStockHistoryEntity r WHERE r.purchaseHistory.id = :purchaseHistoryId ORDER BY r.reducedAt DESC")
    List<ReduceStockHistoryEntity> findByPurchaseHistoryIdOrderByReducedAtDesc(@Param("purchaseHistoryId") Long purchaseHistoryId);
    
    @Query("SELECT r FROM ReduceStockHistoryEntity r WHERE r.reducedAt BETWEEN :fromDate AND :toDate ORDER BY r.reducedAt DESC")
    List<ReduceStockHistoryEntity> findByReducedAtBetweenOrderByReducedAtDesc(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);
    
    @Query("SELECT r FROM ReduceStockHistoryEntity r WHERE r.reductionReason = :reason AND r.reducedAt BETWEEN :fromDate AND :toDate ORDER BY r.reducedAt DESC")
    List<ReduceStockHistoryEntity> findByReductionReasonAndReducedAtBetweenOrderByReducedAtDesc(@Param("reason") String reason, @Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);
} 