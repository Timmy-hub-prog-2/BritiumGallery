package com.maven.demo.dto;

import java.util.List;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VariantResponseDTO {
    private Long id;
    private int price;
    private int stock;
    private List<String> imageUrls;
    // key = attribute name (e.g., "Color"), value = "Black"
    private Map<String, String> attributes;
    private String sku;
    private String productName;
}
