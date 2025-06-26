package com.maven.demo.dto;

import java.util.List;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VariantDTO {
    private int price;
    private int stock;
    private int purchasePrice;
    private List<String> imageUrls; // List of image URLs to keep for the variant
    private List<String> imageUrlsToDelete; // List of image URLs to delete from the variant

    // key = attribute name (e.g., "RAM"), value = "6GB"
    private Map<String, String> attributes;

    private String PhotoUrl;
}
