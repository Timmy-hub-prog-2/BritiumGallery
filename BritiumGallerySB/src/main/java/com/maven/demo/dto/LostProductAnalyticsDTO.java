package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LostProductAnalyticsDTO {
    private Long productId;
    private String productName;
    private Long variantId;
    private String variantName;
    private String variantAttributes;
    private String sku;
    private String category;
    private String imageUrl;
    private String reductionReason;
    private Integer totalQuantityLost;
    private Integer totalPurchasePriceLost;
    private String lastReducedAt;
    private String adminName;
    private Integer reductionCount;
} 