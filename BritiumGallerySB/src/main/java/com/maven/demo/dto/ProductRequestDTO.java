package com.maven.demo.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequestDTO {
    private String name;
    private String description;
    private double rating;
    private Long categoryId;
    private Long adminId;
    private String basePhotoUrl;
    private List<AttributeOptionDTO> attributeOptions;
    private List<VariantDTO> variants;
}
