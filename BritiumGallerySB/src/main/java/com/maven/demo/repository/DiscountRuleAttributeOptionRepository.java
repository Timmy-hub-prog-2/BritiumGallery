package com.maven.demo.repository;

import com.maven.demo.entity.DiscountRuleAttributeOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscountRuleAttributeOptionRepository extends JpaRepository<DiscountRuleAttributeOption, Long> {
    List<DiscountRuleAttributeOption> findByRuleId(Long ruleId);
    
    @Modifying
    @Query("DELETE FROM DiscountRuleAttributeOption o WHERE o.rule.id = :ruleId")
    void deleteByRuleId(@Param("ruleId") Long ruleId);
}