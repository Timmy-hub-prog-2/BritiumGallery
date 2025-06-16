package com.maven.demo.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private double rating;
    private LocalDateTime created_at;
    private Long category_id;  // We use ID here instead of full CategoryEntity
    private Long admin_id;
}
