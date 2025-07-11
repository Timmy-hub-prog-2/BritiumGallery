package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountRuleResponseDTO {
    private Long id;
    private Long categoryId;
    private Long productId;
    private Long productVariantId;
    private Double discountPercent;
    private Long adminId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Long> attributeOptionIds;
    private Long brandId;
    private boolean active;
} 