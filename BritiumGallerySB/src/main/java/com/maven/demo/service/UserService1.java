package com.maven.demo.service;

import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface UserService1 {
    List<UserResponseDTO> getAdmins();
    List<UserResponseDTO> getCustomers();

    Optional<UserResponseDTO> getUserProfileById(Long id);

    Optional<UserResponseDTO> updateUserProfile(Long id, UserDTO userDto, MultipartFile imageFile);
}
