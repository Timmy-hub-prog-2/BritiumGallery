package com.maven.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String gender;
    private String phoneNumber;
    private List<String> ImageUrls;
    private AddressDTO address; // Combined address field
    private Integer status;
    private Long roleId;
    private String customerType;
    private Integer totalSpend;
}
