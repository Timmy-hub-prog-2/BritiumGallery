// New DTO for reducing stock
package com.maven.demo.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReduceStockRequestDTO {
    private List<PurchaseReduction> reductions;
    private String reductionReason; // Reason for the stock reduction

    @Getter
    @Setter
    public static class PurchaseReduction {
        private Long purchaseId;
        private Integer quantity;
    }
} 