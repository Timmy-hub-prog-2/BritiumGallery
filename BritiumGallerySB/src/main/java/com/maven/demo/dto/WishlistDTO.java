package com.maven.demo.dto;

import lombok.Data;

import java.util.Map;

@Data
public class WishlistDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productPhotoUrl;  // ✅ Add this
    private Long userId;
    private String userName;
    private String color;
    private String size;
    private int price;

    private Map<String, String> variantAttributes;
}
