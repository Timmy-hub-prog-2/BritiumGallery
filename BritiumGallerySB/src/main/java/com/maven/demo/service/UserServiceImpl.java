package com.maven.demo.service;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.ActiveUserStatsDTO;
import com.maven.demo.dto.AddressDTO;
import com.maven.demo.dto.CustomerAnalyticsDTO;
import com.maven.demo.dto.CustomerTypeStatsDTO;
import com.maven.demo.dto.GeographicStatsDTO;
import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.UserOnlineStatusEntity;
import com.maven.demo.repository.ShopAddressRepository;
import com.maven.demo.repository.UserOnlineStatusRepository;
import com.maven.demo.repository.UserRepository;

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
        List<UserEntity> admins = userRepository.findAllByRoleNameNot("Customer");

        return admins.stream()
                .map(this::convertToDto)
                .filter(dto -> {
                    if ("online".equalsIgnoreCase(status)) {
                        return Boolean.TRUE.equals(dto.getIsOnline());
                    } else if ("recent".equalsIgnoreCase(status)) {
                        return Boolean.FALSE.equals(dto.getIsOnline());
                    } else if ("offline".equalsIgnoreCase(status)) {
                        return dto.getIsOnline() == null;
                    }
                    return true;
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

    // Customer Analysis Methods
    @Override
    public List<CustomerAnalyticsDTO> getCustomersWithAnalytics() {
        List<UserEntity> customers = userRepository.findAllByRoleName("Customer");
        return customers.stream()
                .map(this::convertToCustomerAnalyticsDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerTypeStatsDTO> getCustomerTypeStats() {
        List<UserEntity> customers = userRepository.findAllByRoleName("Customer");
        Map<String, CustomerTypeStatsDTO> statsMap = new HashMap<>();
        
        for (UserEntity customer : customers) {
            String customerType = customer.getCustomerType() != null ? customer.getCustomerType().getType() : "Normal";
            
            if (!statsMap.containsKey(customerType)) {
                CustomerTypeStatsDTO stats = new CustomerTypeStatsDTO();
                stats.setType(customerType);
                stats.setCount(0);
                stats.setTotalSpent(0);
                stats.setActiveUsers(0);
                statsMap.put(customerType, stats);
            }
            
            CustomerTypeStatsDTO stats = statsMap.get(customerType);
            stats.setCount(stats.getCount() + 1);
            
            // Calculate total spend
            if (customer.getTotalSpends() != null && !customer.getTotalSpends().isEmpty()) {
                int totalSpent = customer.getTotalSpends().stream().mapToInt(ts -> ts.getAmount()).sum();
                stats.setTotalSpent(stats.getTotalSpent() + totalSpent);
            }
            
            // Check if user is online
            Optional<UserOnlineStatusEntity> statusOpt = userOnlineStatusRepository.findByUser(customer);
            if (statusOpt.isPresent() && statusOpt.get().isOnline()) {
                stats.setActiveUsers(stats.getActiveUsers() + 1);
            }
        }
        
        // Calculate percentages and averages
        int totalCustomers = customers.size();
        return statsMap.values().stream()
                .peek(stats -> {
                    stats.setPercentage((double) stats.getCount() / totalCustomers * 100);
                    stats.setAverageSpent(stats.getCount() > 0 ? (double) stats.getTotalSpent() / stats.getCount() : 0.0);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<GeographicStatsDTO> getGeographicStats() {
        List<UserEntity> customers = userRepository.findAllByRoleName("Customer");
        Map<String, GeographicStatsDTO> statsMap = new HashMap<>();
        
        for (UserEntity customer : customers) {
            String city = "Unknown";
            if (customer.getAddresses() != null) {
                Optional<AddressEntity> mainAddress = customer.getAddresses().stream()
                        .filter(AddressEntity::isMainAddress)
                        .findFirst();
                if (mainAddress.isPresent() && mainAddress.get().getCity() != null) {
                    city = mainAddress.get().getCity();
                }
            }
            
            if (!statsMap.containsKey(city)) {
                GeographicStatsDTO stats = new GeographicStatsDTO();
                stats.setLocation(city);
                stats.setCount(0);
                stats.setTotalSpent(0);
                statsMap.put(city, stats);
            }
            
            GeographicStatsDTO stats = statsMap.get(city);
            stats.setCount(stats.getCount() + 1);
            
            // Calculate total spend
            if (customer.getTotalSpends() != null && !customer.getTotalSpends().isEmpty()) {
                int totalSpent = customer.getTotalSpends().stream().mapToInt(ts -> ts.getAmount()).sum();
                stats.setTotalSpent(stats.getTotalSpent() + totalSpent);
            }
        }
        
        // Calculate percentages and averages
        int totalCustomers = customers.size();
        return statsMap.values().stream()
                .peek(stats -> {
                    stats.setPercentage((double) stats.getCount() / totalCustomers * 100);
                    stats.setAverageSpent(stats.getCount() > 0 ? (double) stats.getTotalSpent() / stats.getCount() : 0.0);
                })
                .collect(Collectors.toList());
    }

    @Override
    public ActiveUserStatsDTO getActiveUserStats() {
        List<UserEntity> customers = userRepository.findAllByRoleName("Customer");
        ActiveUserStatsDTO stats = new ActiveUserStatsDTO();
        
        stats.setTotalUsers(customers.size());
        
        int onlineUsers = 0;
        int recentUsers = 0;
        int offlineUsers = 0;
        
        for (UserEntity customer : customers) {
            Optional<UserOnlineStatusEntity> statusOpt = userOnlineStatusRepository.findByUser(customer);
            
            if (statusOpt.isPresent()) {
                UserOnlineStatusEntity status = statusOpt.get();
                if (status.isOnline()) {
                    onlineUsers++;
                } else if (status.getLastOnlineAt() != null) {
                    Duration duration = Duration.between(status.getLastOnlineAt(), LocalDateTime.now());
                    if (duration.toMinutes() < 60) {
                        recentUsers++;
                    } else {
                        offlineUsers++;
                    }
                } else {
                    offlineUsers++;
                }
            } else {
                offlineUsers++;
            }
        }
        
        stats.setOnlineUsers(onlineUsers);
        stats.setRecentUsers(recentUsers);
        stats.setOfflineUsers(offlineUsers);
        stats.setGrowthRate(8.02); // Mock growth rate
        
        return stats;
    }

    private CustomerAnalyticsDTO convertToCustomerAnalyticsDTO(UserEntity user) {
        CustomerAnalyticsDTO dto = new CustomerAnalyticsDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRegistrationDate(user.getCreatedAt());
        dto.setStatus(user.getStatus() != null && user.getStatus() == 1 ? "Active" : "Inactive");
        
        // Set customer type
        if (user.getCustomerType() != null) {
            dto.setCustomerType(user.getCustomerType().getType());
        } else {
            dto.setCustomerType("Normal");
        }
        
        // Calculate total spend and order count
        if (user.getTotalSpends() != null && !user.getTotalSpends().isEmpty()) {
            int totalSpent = user.getTotalSpends().stream().mapToInt(ts -> ts.getAmount()).sum();
            dto.setTotalSpend(totalSpent);
            dto.setOrderCount(user.getTotalSpends().size());
            dto.setAverageOrderValue((double) totalSpent / user.getTotalSpends().size());
        } else {
            dto.setTotalSpend(0);
            dto.setOrderCount(0);
            dto.setAverageOrderValue(0.0);
        }
        
        // Set address information
        if (user.getAddresses() != null) {
            Optional<AddressEntity> mainAddress = user.getAddresses().stream()
                    .filter(AddressEntity::isMainAddress)
                    .findFirst();
            if (mainAddress.isPresent()) {
                dto.setCity(mainAddress.get().getCity());
                dto.setCountry(mainAddress.get().getCountry());
            }
        }
        
        // Set online status
        Optional<UserOnlineStatusEntity> statusOpt = userOnlineStatusRepository.findByUser(user);
        if (statusOpt.isPresent()) {
            UserOnlineStatusEntity status = statusOpt.get();
            dto.setIsOnline(status.isOnline());
            dto.setLastSeenAt(status.getLastOnlineAt());
        } else {
            dto.setIsOnline(false);
            dto.setLastSeenAt(null);
        }
        
        return dto;
    }
}