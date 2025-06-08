package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

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
    private List<VariantResponseDTO> variants;
}
