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
    private String customerType;

    public LoginResponseDTO(UserEntity user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.phoneNumber = user.getPhoneNumber();
        this.gender = user.getGender();
        this.status = user.getStatus();
        this.roleId = user.getRole() != null ? user.getRole().getId() : null;
        this.imageUrls = user.getImageUrls();
        if (user.getCustomerType() != null) {
            this.customerType = user.getCustomerType().getType();
        } else if (user.getRole() != null && user.getRole().getType() != null) {
            this.customerType = user.getRole().getType();
        } else {
            this.customerType = null;
        }
    }
}
