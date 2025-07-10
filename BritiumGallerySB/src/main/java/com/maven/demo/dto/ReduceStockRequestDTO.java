// New DTO for reducing stock
package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ReduceStockRequestDTO {
    private List<PurchaseReduction> reductions;

    @Getter
    @Setter
    public static class PurchaseReduction {
        private Long purchaseId;
        private Integer quantity;
    }
} 