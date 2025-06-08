package com.maven.demo.dto;

import com.maven.demo.entity.UserEntity;
import lombok.Data;

import java.util.List;

@Data
public class LoginResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String gender;
    private Integer status;
    private Long roleId;
    private List<String> imageUrls;

    public LoginResponseDTO(UserEntity user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.phoneNumber = user.getPhoneNumber();
        this.gender = user.getGender();
        this.status = user.getStatus();
        this.roleId = user.getRole().getId();
        this.imageUrls = user.getImageUrls();
    }
}
