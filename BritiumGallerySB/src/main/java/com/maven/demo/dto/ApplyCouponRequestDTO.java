package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplyCouponRequestDTO {
    private Long userId;
    private String couponCode;
    private double cartTotal;
}