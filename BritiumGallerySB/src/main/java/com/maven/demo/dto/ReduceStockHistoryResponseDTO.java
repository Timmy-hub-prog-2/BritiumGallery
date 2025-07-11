package com.maven.demo.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReduceStockHistoryResponseDTO {
    private Long id;
    private Long variantId;
    private String variantSku;
    private String productName;
    private Long purchaseHistoryId;
    private Integer quantityReduced;
    private Integer purchasePriceAtReduction;
    private String reductionReason;
    private Long adminId;
    private String adminName;
    private LocalDateTime reducedAt;
    private Integer totalStockBeforeReduction;
    private Integer totalStockAfterReduction;
} 