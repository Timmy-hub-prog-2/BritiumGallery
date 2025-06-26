package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddStockRequestDTO {
    private Integer purchasePrice;
    private Integer sellingPrice;
    private Integer quantity;
} 