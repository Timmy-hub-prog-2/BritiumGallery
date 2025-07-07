package com.maven.demo.repository;
import com.maven.demo.entity.DiscountEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DiscountEventRepository extends JpaRepository<DiscountEvent, Long> {
    List<DiscountEvent> findByActiveTrueAndStartDateBeforeAndEndDateAfter(LocalDate now1, LocalDate now2);
    
    // Find events created by specific admin
    List<DiscountEvent> findByAdminId(Long adminId);
    
    // Find active events created by specific admin
    List<DiscountEvent> findByAdminIdAndActiveTrue(Long adminId);
}
