package com.maven.demo.service;

import com.maven.demo.dto.ShopAddressDTO;
import com.maven.demo.entity.ShopAddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.ShopAddressRepository;
import com.maven.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopAddressService {

    private final ShopAddressRepository shopAddressRepository;
    private final UserRepository userRepository;

    // Create new shop address
    public ShopAddressDTO save(ShopAddressDTO dto) {
        Optional<UserEntity> userOpt = userRepository.findById(dto.getUserId());
        if (userOpt.isEmpty()) throw new RuntimeException("User not found");

        UserEntity user = userOpt.get();
        if (user.getRole() == null || user.getRole().getId() != 2) {
            throw new RuntimeException("Only admins can save shop addresses");
        }

        ShopAddressEntity entity = new ShopAddressEntity();
        mapDtoToEntity(dto, entity);
        entity.setUser(user);

        ShopAddressEntity saved = shopAddressRepository.save(entity);
        return toDTO(saved);
    }

    // List all shop addresses
    public List<ShopAddressDTO> findAll() {
        return shopAddressRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // List shop addresses by user
    public List<ShopAddressDTO> findByUserId(Long userId) {
        return shopAddressRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Update a shop address
    public ShopAddressDTO update(ShopAddressDTO dto) {
        ShopAddressEntity existing = shopAddressRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Shop address not found"));

        mapDtoToEntity(dto, existing);
        ShopAddressEntity saved = shopAddressRepository.save(existing);
        return toDTO(saved);
    }

    // Delete a shop address
    public void delete(Long id) {
        if (!shopAddressRepository.existsById(id)) {
            throw new RuntimeException("Shop address not found");
        }
        shopAddressRepository.deleteById(id);
    }

    // Set a main shop address for user (only one main allowed)
    @Transactional
    public void setMainAddress(Long userId, Long addrId) {
        List<ShopAddressEntity> list = shopAddressRepository.findByUserId(userId);
        for (ShopAddressEntity addr : list) {
            addr.setMainAddress(addr.getId().equals(addrId));
            shopAddressRepository.save(addr);
        }
    }

    // Utility: Convert Entity to DTO
    private ShopAddressDTO toDTO(ShopAddressEntity entity) {
        ShopAddressDTO dto = new ShopAddressDTO();
        dto.setId(entity.getId());
        dto.setCity(entity.getCity());
        dto.setTownship(entity.getTownship());
        dto.setStreet(entity.getStreet());
        dto.setHouseNumber(entity.getHouseNumber());
        dto.setWardName(entity.getWardName());
        dto.setLatitude(entity.getLatitude());
        dto.setLongitude(entity.getLongitude());
        dto.setState(entity.getState());
        dto.setCountry(entity.getCountry());
        dto.setPostalCode(entity.getPostalCode());
        dto.setMainAddress(entity.isMainAddress());

        if (entity.getUser() != null && entity.getUser().getRole() != null && entity.getUser().getRole().getId() == 2) {
            dto.setUserId(entity.getUser().getId());
            dto.setCreatedByAdminName(entity.getUser().getName());
            dto.setCreatedByAdminEmail(entity.getUser().getEmail());
        }

        return dto;
    }
    // Utility: Map DTO to Entity (for both create and update)
    private void mapDtoToEntity(ShopAddressDTO dto, ShopAddressEntity entity) {
        entity.setCity(dto.getCity());
        entity.setTownship(dto.getTownship());
        entity.setStreet(dto.getStreet());
        entity.setHouseNumber(dto.getHouseNumber());
        entity.setWardName(dto.getWardName());
        entity.setLatitude(dto.getLatitude());
        entity.setLongitude(dto.getLongitude());
        entity.setState(dto.getState());
        entity.setCountry(dto.getCountry());
        entity.setPostalCode(dto.getPostalCode());
        entity.setMainAddress(dto.isMainAddress());
    }
}