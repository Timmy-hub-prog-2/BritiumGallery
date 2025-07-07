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
    private Long adminId;
    private String basePhotoUrl;
    private String brand;
    private List<VariantResponseDTO> variants;
}
