package com.maven.demo.dto;

import lombok.Data;

@Data
public class WishlistDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productPhotoUrl;  // ✅ Add this
    private Long userId;
    private String userName;
}
