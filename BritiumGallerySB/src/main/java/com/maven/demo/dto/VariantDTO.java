package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class VariantDTO {
    private int price;
    private int stock;
    private String photoUrl;

    // key = attribute name (e.g., "RAM"), value = "6GB"
    private Map<String, String> attributes;
}
