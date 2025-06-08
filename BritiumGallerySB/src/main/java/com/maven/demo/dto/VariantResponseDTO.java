package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class VariantResponseDTO {
    private Long id;
    private int price;
    private int stock;
    private List<String> imageUrls;
    // key = attribute name (e.g., "Color"), value = "Black"
    private Map<String, String> attributes;
}
