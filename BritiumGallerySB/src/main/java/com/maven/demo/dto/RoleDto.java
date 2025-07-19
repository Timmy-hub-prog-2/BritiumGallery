package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleDto {
    private long id;
    private String type;

    public RoleDto(long id, String type) {
        this.id = id;
        this.type = type;
    }

    // Getters
}
