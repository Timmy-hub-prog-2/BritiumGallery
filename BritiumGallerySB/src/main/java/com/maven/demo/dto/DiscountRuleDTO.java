package com.maven.demo.dto;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscountRuleDTO {
    private Long categoryId;
    private Long productVariantId;
    private Double discountPercent;
    private List<Long> attributeOptionIds;
    private Long adminId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long productId;
    private Long brandId;
    
    // Validation methods
    public boolean isValid() {
        // Must have only one of categoryId, productId, or productVariantId
        int count = 0;
        if (categoryId != null) count++;
        if (productId != null) count++;
        if (productVariantId != null) count++;
        if (brandId != null) count++;
        boolean hasTarget = (count == 1);
        boolean validDiscount = discountPercent != null && discountPercent > 0 && discountPercent <= 100;
        return hasTarget && validDiscount && adminId != null;
    }
    
    public boolean isCategoryDiscount() {
        return categoryId != null && productId == null && productVariantId == null;
    }
    
    public boolean isProductDiscount() {
        return productId != null && categoryId == null && productVariantId == null;
    }
    
    public boolean isProductVariantDiscount() {
        return productVariantId != null && categoryId == null && productId == null;
    }
}
