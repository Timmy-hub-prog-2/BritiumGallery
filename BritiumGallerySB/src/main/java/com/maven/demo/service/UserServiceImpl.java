package com.maven.demo.service;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.AddressDTO;
import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.dto.AddressDTO;
import com.maven.demo.dto.CustomerGrowthDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.ShopAddressRepository;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.entity.UserOnlineStatusEntity;
import com.maven.demo.repository.UserOnlineStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

@Service
public class UserServiceImpl implements UserService1 {

    private static final long ADMIN_ROLE_ID = 2L;
    private static final long CUSTOMER_ROLE_ID = 3L;

    private final ShopAddressRepository shopAddressRepository;
    private final UserRepository userRepository;
    private CloudinaryUploadService cloudinaryUploadService;

    @Autowired
    private UserOnlineStatusRepository userOnlineStatusRepository;

    @Autowired
    public UserServiceImpl(ShopAddressRepository shopAddressRepository, UserRepository userRepository) {
        this.shopAddressRepository = shopAddressRepository;
        this.userRepository = userRepository;
    }


    @Override
    public List<UserResponseDTO> getAdmins(String status) {
        List<UserEntity> admins = userRepository.findAllByRoleName("Admin");

        return admins.stream()
                .map(this::convertToDto)
                .filter(dto -> {
                    if ("online".equalsIgnoreCase(status)) {
                        return Boolean.TRUE.equals(dto.getIsOnline());
                    } else if ("recent".equalsIgnoreCase(status)) {
                        return Boolean.FALSE.equals(dto.getIsOnline());
                    } else if ("offline".equalsIgnoreCase(status)) {
                        // ✅ Only users without tracking record (isOnline == null)
                        return dto.getIsOnline() == null;
                    }
                    return true; // No filter
                })
                .collect(Collectors.toList());
    }


    @Override
    public List<UserResponseDTO> getCustomers(String status) {
        List<UserEntity> customers = userRepository.findAllByRoleName("Customer");

        return customers.stream()
                .map(this::convertToDto)
                .filter(dto -> {
                    if ("online".equalsIgnoreCase(status)) {
                        return Boolean.TRUE.equals(dto.getIsOnline());
                    } else if ("recent".equalsIgnoreCase(status)) {
                        return Boolean.FALSE.equals(dto.getIsOnline());

                    } else if ("offline".equalsIgnoreCase(status)) {
                        // ✅ Only users without tracking record (isOnline == null)
                        return dto.getIsOnline() == null;
                    }
                    return true; // No filter
                })
                .collect(Collectors.toList());
    }


    // Convert UserEntity to UserResponseDTO
    private UserResponseDTO convertToDto(UserEntity user) {
        UserResponseDTO dto = new UserResponseDTO();

        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setGender(user.getGender());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRoleId(user.getRole() != null ? user.getRole().getId() : CUSTOMER_ROLE_ID);
        dto.setRoleName(user.getRole() != null ? user.getRole().getType() : "Unknown");

        dto.setImageUrls(user.getImageUrls());

        if (user.getCustomerType() != null) {
            dto.setCustomerType(user.getCustomerType().getType());
        }

        if (user.getTotalSpends() != null && !user.getTotalSpends().isEmpty()) {
            int total = user.getTotalSpends().stream().mapToInt(ts -> ts.getAmount()).sum();
            dto.setTotalSpend(total);
        } else {
            dto.setTotalSpend(0);
        }

        // Map main address
        user.getAddresses().stream()
                .filter(AddressEntity::isMainAddress)
                .findFirst()
                .ifPresent(address -> dto.setAddress(mapToAddressDTO(address)));

        // --- Online status ---
        Optional<UserOnlineStatusEntity> statusOpt = userOnlineStatusRepository.findByUser(user);

        if (statusOpt.isPresent()) {
            UserOnlineStatusEntity status = statusOpt.get();
            dto.setIsOnline(status.isOnline());

            if (status.isOnline()) {
                dto.setLastSeenAt("Online");
            } else if (status.getLastOnlineAt() != null) {
                Duration duration = Duration.between(status.getLastOnlineAt(), LocalDateTime.now());
                long minutes = duration.toMinutes();
                if (minutes < 60) {
                    dto.setLastSeenAt("Last seen " + minutes + " minutes ago");
                } else if (minutes < 1440) {
                    long hours = minutes / 60;
                    dto.setLastSeenAt("Last seen " + hours + " hours ago");
                } else {
                    long days = minutes / 1440;
                    dto.setLastSeenAt("Last seen " + days + " days ago");
                }
            } else {
                dto.setLastSeenAt("Offline");
            }
        } else {
            dto.setIsOnline(null); // not tracked
            dto.setLastSeenAt("Status unknown");
        }

        return dto;
    }
    // Mapping AddressEntity to AddressDTO
    private AddressDTO mapToAddressDTO(AddressEntity addr) {
        AddressDTO dto = new AddressDTO();
        dto.setId(addr.getId());
        dto.setCity(addr.getCity());
        dto.setTownship(addr.getTownship());
        dto.setStreet(addr.getStreet());
        dto.setHouseNumber(addr.getHouseNumber());
        dto.setWardName(addr.getWardName());
        dto.setLatitude(addr.getLatitude());
        dto.setLongitude(addr.getLongitude());
        dto.setState(addr.getState());
        dto.setCountry(addr.getCountry());
        dto.setPostalCode(addr.getPostalCode());
        dto.setMainAddress(addr.isMainAddress());
        dto.setUserId(addr.getUser().getId());
        return dto;
    }

    @Override
    public Optional<UserResponseDTO> getUserProfileById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDto);
    }

    @Override
    public Optional<UserEntity> getUserEntityById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<UserResponseDTO> updateUserProfile(Long id, UserDTO userDto, MultipartFile imageFile) {
        Optional<UserEntity> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            UserEntity userEntity = optionalUser.get();

            // Update allowed fields
            userEntity.setName(userDto.getName());
            userEntity.setPhoneNumber(userDto.getPhoneNumber());

            // Upload new image if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imageUrl = cloudinaryUploadService.uploadToCloudinary(imageFile, "user");
                    userEntity.setImageUrls(List.of(imageUrl));
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload profile image", e);
                }
            }

            userRepository.save(userEntity);
            return Optional.of(convertToDto(userEntity));
        }

        return Optional.empty();
    }



}