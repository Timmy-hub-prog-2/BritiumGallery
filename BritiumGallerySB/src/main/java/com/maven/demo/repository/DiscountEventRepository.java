package com.maven.demo.repository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.demo.entity.DiscountEvent;

public interface DiscountEventRepository extends JpaRepository<DiscountEvent, Long> {
    List<DiscountEvent> findByActiveTrueAndStartDateBeforeAndEndDateAfter(LocalDate now1, LocalDate now2);
    
    // Find events created by specific admin
    List<DiscountEvent> findByAdminId(Long adminId);
    
    // Find active events created by specific admin
    List<DiscountEvent> findByAdminIdAndActiveTrue(Long adminId);

    List<DiscountEvent> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(java.time.LocalDate start, java.time.LocalDate end);
    
    // Find active events that have expired (end date is before today)
    List<DiscountEvent> findByActiveTrueAndEndDateBefore(LocalDate today);
}
