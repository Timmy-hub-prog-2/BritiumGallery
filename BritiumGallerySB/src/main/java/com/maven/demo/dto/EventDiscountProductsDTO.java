package com.maven.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventDiscountProductsDTO {

    private String eventName;
    private LocalDate eventDueDate;
    private Long eventId;
    private List<DiscountedProductDTO> products;

    @Getter
    @Setter
    public static class DiscountedProductDTO {
        private Long productId;
        private Long variantId;
        private String productName;
        private String imageUrl;
        private String sku;
        private BigDecimal originalPrice;
        private Double discountPercent;
        private BigDecimal discountedPrice;
        private java.util.Map<String, String> attributes;

        public void setAttributes(java.util.Map<String, String> attributes) {
            this.attributes = attributes;
        }
    }
} 