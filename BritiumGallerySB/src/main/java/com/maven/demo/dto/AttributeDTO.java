package com.maven.demo.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttributeDTO {
    private Long id;
    private String name;
    private String dataType;
    private List<String> options;
}
