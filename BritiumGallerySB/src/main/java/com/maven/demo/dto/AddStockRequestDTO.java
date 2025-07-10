package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AddStockRequestDTO {
    private Integer purchasePrice;
    private Integer sellingPrice;
    private Integer quantity;
}

