package com.maven.demo.service;

import com.maven.demo.dto.UserResponseDTO;

import java.util.List;

public interface UserService1 {
    List<UserResponseDTO> getAdmins();
    List<UserResponseDTO> getCustomers();

}
