package com.maven.demo.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttributeOptionDTO {
    private Long attributeId;
    private String[] options;
}