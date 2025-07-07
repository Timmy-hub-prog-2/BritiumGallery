package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountEventResponseDTO {
    private Long id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private Long adminId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DiscountRuleResponseDTO> rules;
} 