package com.maven.demo.dto;

import lombok.Data;

@Data
public class PrivacyPolicyDTO {
    private Long id;
    private String content;
    private boolean active;
}
