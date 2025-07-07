package com.maven.demo.dto;

import java.util.List;

import lombok.Data;

@Data
public class RefundRequestDTO {
    private Long orderId;
    private String type; // "FULL" or "PARTIAL"
    private String reason; // Used for full order refund
    private List<RefundItemDTO> items; // Used for partial refund

    @Data
    public static class RefundItemDTO {
        private Long orderDetailId;
        private Integer quantity;
        private String reason;
    }
} 