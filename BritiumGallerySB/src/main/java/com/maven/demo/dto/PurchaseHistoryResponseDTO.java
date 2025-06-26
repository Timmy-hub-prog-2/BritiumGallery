package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class PurchaseHistoryResponseDTO {
    private Long id;
    private Integer purchasePrice;
    private Integer quantity;
    private Integer remainingQuantity;
    private LocalDateTime purchaseDate;
    private String adminName;
    private Long adminId;
} 