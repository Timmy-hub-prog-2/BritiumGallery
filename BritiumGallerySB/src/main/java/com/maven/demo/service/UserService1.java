package com.maven.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.entity.UserEntity;

public interface UserService1 {
    List<UserResponseDTO> getAdmins(String status);
    List<UserResponseDTO> getCustomers(String status);

    Optional<UserResponseDTO> getUserProfileById(Long id);

    Optional<UserResponseDTO> updateUserProfile(Long id, UserDTO userDto, MultipartFile imageFile);

    Optional<UserEntity> getUserEntityById(Long id);
}
