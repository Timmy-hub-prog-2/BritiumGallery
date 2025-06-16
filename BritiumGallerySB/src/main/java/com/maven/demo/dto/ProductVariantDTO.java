package com.maven.demo.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductVariantDTO {
    private Long id;
    private Long productId;   // Only store product ID in the DTO
    private int price;
    private int stock;
    private Long adminId;
}
