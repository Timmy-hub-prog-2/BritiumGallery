package com.maven.demo.repository;

import com.maven.demo.entity.DiscountRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Long> {
    List<DiscountRule> findByEventId(Long eventId);
    
    @Modifying
    @Query("DELETE FROM DiscountRule r WHERE r.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}
