package com.maven.demo.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private double rating;
    private Long categoryId;
    private String categoryName;
    private Long adminId;
    private String brand;
    private Long brandId;
    private String basePhotoUrl;
    private List<VariantResponseDTO> variants;

    private int status;
}
