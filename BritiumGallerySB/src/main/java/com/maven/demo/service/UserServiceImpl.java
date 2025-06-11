package com.maven.demo.service;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.service.UserService;
import com.maven.demo.service.UserService1;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService1 {

    private static final long ADMIN_ROLE_ID = 2L;
    private static final long CUSTOMER_ROLE_ID = 3L;

    @Autowired
    private UserRepository userRepository;

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

    private UserResponseDTO convertToDto(UserEntity user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setGender(user.getGender());
        dto.setPhoneNumber(user.getPhoneNumber());

        Optional<AddressEntity> mainAddressOpt = user.getAddresses()
                .stream()
                .filter(AddressEntity::isMainAddress)
                .findFirst();

        if (mainAddressOpt.isPresent()) {
            AddressEntity addr = mainAddressOpt.get();
            StringBuilder fullAddress = new StringBuilder();

            if (addr.getState() != null) fullAddress.append(addr.getState()).append(", ");
            if (addr.getCity() != null) fullAddress.append(addr.getCity()).append(", ");
            if (addr.getTownship() != null) fullAddress.append(addr.getTownship()).append(", ");
            if (addr.getStreet() != null) fullAddress.append(addr.getStreet()).append(", ");
            if (addr.getWardName() != null) fullAddress.append(addr.getWardName()).append(", ");
            if (addr.getHouseNumber() != null) fullAddress.append(addr.getHouseNumber());


            // Remove trailing comma and space if present
            String addressString = fullAddress.toString().trim();
            if (addressString.endsWith(",")) {
                addressString = addressString.substring(0, addressString.length() - 1);
            }

            dto.setAddress(addressString);
        }

        return dto;
    }
}