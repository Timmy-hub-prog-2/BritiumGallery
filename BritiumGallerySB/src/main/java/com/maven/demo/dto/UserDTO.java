package com.maven.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserDTO {
    private String name;
    private String email;
    private String password;
    private String phoneNumber;
    private List<String> imageUrls;
    private String gender;
    private Integer status;
    private Long roleId;
}

