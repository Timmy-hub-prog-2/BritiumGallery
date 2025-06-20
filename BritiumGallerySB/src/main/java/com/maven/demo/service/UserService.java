package com.maven.demo.service;

import com.maven.demo.dto.AddressDTO;
import com.maven.demo.dto.LoginResponseDTO;
import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.entity.CustomerTypeEntity;
import com.maven.demo.entity.RoleEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.CustomerTypeRepository;
import com.maven.demo.repository.RoleRepository;
import com.maven.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AddressService addressService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private CustomerTypeRepository customerTypeRepository;

    public String registerUser(UserDTO dto) {
        String phone = dto.getPhoneNumber().trim();
        if (phone.startsWith("+959")) {
            phone = phone.replaceFirst("\\+959", "09");
        }

        if (userRepository.existsByEmail(dto.getEmail())) {
            return "Email already exists";
        }

        if (userRepository.existsByPhoneNumber(phone)) {
            return "Phone number already exists";
        }

        if (!phone.matches("^09[0-9]{7,9}$")) {
            return "Invalid phone number format";
        }

        RoleEntity role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        CustomerTypeEntity defaultType = customerTypeRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default customer type not found"));

        List<String> imageUrls = dto.getImageUrls();
        if (imageUrls == null || imageUrls.isEmpty()) {
            imageUrls = List.of("https://res.cloudinary.com/dmbwaqjta/image/upload/v1748967961/Default_Photo_k8ihoe.png");
        }

        UserEntity user = new UserEntity();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setPhoneNumber(phone);
        user.setImageUrls(imageUrls);
        user.setGender(dto.getGender());
        user.setStatus(0);
        user.setRole(role);

        user.setCustomerType(defaultType);

        userRepository.save(user);

        UserEntity savedUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after save"));
        System.out.println("🔍 Saved user ID: " + savedUser.getId());

        boolean useSms = false;
        otpService.generateAndSendOtp(savedUser, useSms, false);

        return "User registered successfully";
    }


    public LoginResponseDTO login(String email, String password) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) throw new RuntimeException("Invalid email");

        UserEntity user = userOpt.get();
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (user.getStatus() == 0) {
            throw new RuntimeException("Email not verified");
        }

        return new LoginResponseDTO(user);
    }


    public Optional<UserResponseDTO> updateUserProfile(Long id, UserDTO userDto) {
        return userRepository.findById(id).map(existingUser -> {

            // Update basic fields if present
            if (userDto.getName() != null) {
                existingUser.setName(userDto.getName());
            }

            if (userDto.getEmail() != null) {
                existingUser.setEmail(userDto.getEmail());
            }

            if (userDto.getPhoneNumber() != null) {
                existingUser.setPhoneNumber(userDto.getPhoneNumber());
            }

            if (userDto.getGender() != null) {
                existingUser.setGender(userDto.getGender());
            }

            // Replace image URLs only if new ones are sent
            if (userDto.getImageUrls() != null && !userDto.getImageUrls().isEmpty()) {
                existingUser.setImageUrls(new ArrayList<>(userDto.getImageUrls()));
            }

            // Optionally update role and status if provided
            if (userDto.getRoleId() != null) {
                roleRepository.findById(userDto.getRoleId()).ifPresent(existingUser::setRole);
            }

            if (userDto.getStatus() != null) {
                existingUser.setStatus(userDto.getStatus());
            }

            // Save updated entity
            UserEntity updatedUser = userRepository.save(existingUser);

            AddressDTO dto =  addressService.getMainAddressByUserId(id);



            // Manually map entity to response DTO
            UserResponseDTO response = new UserResponseDTO();
            response.setId(updatedUser.getId());
            response.setName(updatedUser.getName());
            response.setEmail(updatedUser.getEmail());
            response.setPhoneNumber(updatedUser.getPhoneNumber());
            response.setImageUrls(updatedUser.getImageUrls());
            response.setGender(updatedUser.getGender());


             response.setStatus(updatedUser.getStatus());
             response.setRoleId(updatedUser.getRole() != null ? updatedUser.getRole().getId() : null);

            return response;
        });
    }

    public boolean changePassword(Long userId, String currentPassword, String newPassword) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        UserEntity user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }


}