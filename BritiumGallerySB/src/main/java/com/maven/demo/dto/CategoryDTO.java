package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CategoryDTO {

    private Long id;
    private String name;
    private LocalDateTime created_at;
    private Long admin_id;
    private Long parent_category_id;
    private List<AttributeDTO> attributes;
    private String image_url;

    private int status;
}
