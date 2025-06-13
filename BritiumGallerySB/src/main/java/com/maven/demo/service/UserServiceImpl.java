package com.maven.demo.service;

import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.dto.AddressDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.ShopAddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.ShopAddressRepository;
import com.maven.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService1 {

    private static final long ADMIN_ROLE_ID = 2L;  // Adjust to correct admin role id
    private static final long CUSTOMER_ROLE_ID = 3L; // Adjust to correct customer role id

    private final ShopAddressRepository shopAddressRepository;
    private final UserRepository userRepository;

    @Autowired
    public UserServiceImpl(ShopAddressRepository shopAddressRepository, UserRepository userRepository) {
        this.shopAddressRepository = shopAddressRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<UserResponseDTO> getAdmins() {
        return userRepository.findByRoleId(ADMIN_ROLE_ID)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponseDTO> getCustomers() {
        return userRepository.findByRoleId(CUSTOMER_ROLE_ID)
                .stream()
                .map(this::convertToDto)
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

        Long roleId = user.getRole().getId(); // Assuming RoleEntity is associated

        // Handle Customer Role (get customer's main address)
        if (roleId == CUSTOMER_ROLE_ID) {
            Optional<AddressEntity> mainAddressOpt = user.getAddresses()
                    .stream()
                    .filter(AddressEntity::isMainAddress)
                    .findFirst();

            mainAddressOpt.ifPresent(address -> {
                // Map AddressEntity to AddressDTO for customer
                AddressDTO addressDTO = mapToAddressDTO(address);
                dto.setAddress(addressDTO);
            });

        } else if (roleId == ADMIN_ROLE_ID) {
            // Handle Admin Role (get admin shop address)
            shopAddressRepository.findByUserIdAndMainAddressTrue(user.getId())
                    .ifPresent(address -> {
                        // Map ShopAddressEntity to AddressDTO for admin
                        AddressDTO addressDTO = mapToAddressDTOFromShopAddress(address);
                        dto.setAddress(addressDTO);
                    });
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

    // Mapping ShopAddressEntity to AddressDTO for admin
    private AddressDTO mapToAddressDTOFromShopAddress(ShopAddressEntity addr) {
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
}
