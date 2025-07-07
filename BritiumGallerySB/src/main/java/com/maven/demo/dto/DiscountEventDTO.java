package com.maven.demo.dto;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscountEventDTO {
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active = true;
    private List<DiscountRuleDTO> rules;
    private Long adminId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Validation methods
    public boolean isValid() {
        return name != null && !name.trim().isEmpty() &&
               startDate != null && endDate != null &&
               startDate.isBefore(endDate) &&
               rules != null && !rules.isEmpty() &&
               adminId != null;
    }
    
    public boolean hasCategoryDiscount() {
        return rules != null && rules.stream()
                .anyMatch(rule -> rule.getCategoryId() != null && rule.getProductVariantId() == null);
    }
    
    public boolean hasProductDiscount() {
        return rules != null && rules.stream()
                .anyMatch(rule -> rule.getProductVariantId() != null);
    }
}