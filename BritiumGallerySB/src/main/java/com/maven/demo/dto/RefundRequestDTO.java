package com.maven.demo.dto;

import java.time.LocalDateTime;
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

    @Data
    public static class RefundHistoryDTO {
        private Long id;
        private Long orderId;
        private String orderTrackingCode;
        private String reason;
        private String status;
        private Integer amount;
        private String proofImageUrl;
        private LocalDateTime requestedAt;

        private boolean fullReturn; // Add this field

        // Getter and Setter
        public boolean isFullReturn() {
            return fullReturn;
        }

        public void setFullReturn(boolean fullReturn) {
            this.fullReturn = fullReturn;
        }

    }

} 