package com.maven.demo.repository;

import com.maven.demo.entity.DiscountEventHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DiscountEventHistoryRepository extends JpaRepository<DiscountEventHistory, Long> {
    
    // Find all history records for a specific event
    List<DiscountEventHistory> findByEventIdOrderByCreatedAtDesc(Long eventId);
    
    // Find all history records by admin ID
    List<DiscountEventHistory> findByAdminIdOrderByCreatedAtDesc(Long adminId);
    
    // Find history records by event ID and action
    List<DiscountEventHistory> findByEventIdAndActionOrderByCreatedAtDesc(Long eventId, String action);
    
    @Modifying
    @Query("DELETE FROM DiscountEventHistory h WHERE h.eventId = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
} 