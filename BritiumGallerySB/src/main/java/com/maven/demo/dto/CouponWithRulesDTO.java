package com.maven.demo.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CouponWithRulesDTO {
    private String code;
    private String type;
    private String discount;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;

    private List<CustomerRuleDTO> rules;
}
