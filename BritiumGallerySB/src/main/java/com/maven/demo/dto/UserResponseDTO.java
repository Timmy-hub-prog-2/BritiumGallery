package com.maven.demo.dto;

import lombok.Data;

@Data
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String gender;
    private String phoneNumber;

    private AddressDTO address; // Combined address field
}
