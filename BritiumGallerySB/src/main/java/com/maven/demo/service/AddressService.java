package com.maven.demo.service;

import com.maven.demo.dto.AddressDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.AddressRepository;
import com.maven.demo.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    /**
     * Save a new address for a user. Automatically sets as main if it's their first.
     */
    public AddressDTO save(AddressDTO dto) {
        AddressEntity entity = new AddressEntity();
        BeanUtils.copyProperties(dto, entity);

        if (dto.getUserId() != null) {
            UserEntity user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + dto.getUserId()));
            entity.setUser(user);

            boolean isFirstAddress = addressRepository.countByUser(user) == 0;
            entity.setMainAddress(isFirstAddress); // First address becomes main
        }

        AddressEntity saved = addressRepository.save(entity);
        return toDto(saved);
    }

    /**
     * Set an address as the main one for a user.
     */
    @Transactional
    public void setMainAddress(Long userId, Long addressId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Clear existing main address
        addressRepository.clearMainAddressForUser(userId);

        AddressEntity address = addressRepository.findById(addressId)
                .orElseThrow(() -> new EntityNotFoundException("Address not found with ID: " + addressId));

        if (address.getUser() == null || address.getUser().getId() != userId) {
            throw new RuntimeException("This address doesn't belong to the user");
        }           


        address.setMainAddress(true);
        addressRepository.save(address);
    }

    /**
     * Get all addresses for a given user.
     */
    public List<AddressDTO> getAddressesByUserId(Long userId) {
        List<AddressEntity> addresses = addressRepository.findByUserId(userId);
        return addresses.stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Get all addresses in the system.
     */
    public List<AddressDTO> getAllAddresses() {
        return addressRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Update address by ID.
     */
    public AddressDTO update(Long id, AddressDTO dto) {
        AddressEntity existing = addressRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Address not found with ID: " + id));

        BeanUtils.copyProperties(dto, existing, "id", "user", "mainAddress"); // prevent overwriting user/main

        return toDto(addressRepository.save(existing));
    }

    /**
     * Delete address by ID.
     */
    public void delete(Long id) {
        if (!addressRepository.existsById(id)) {
            throw new EntityNotFoundException("Address not found with ID: " + id);
        }
        addressRepository.deleteById(id);
    }

    public AddressDTO getMainAddressByUserId(Long userId) {
        AddressEntity mainAddress = addressRepository.findByUserIdAndMainAddressTrue(userId)
                .orElseThrow(() -> new EntityNotFoundException("Main address not found for user ID: " + userId));
        return toDto(mainAddress);
    }


    /**
     * Convert Entity -> DTO
     */
    private AddressDTO toDto(AddressEntity entity) {
        AddressDTO dto = new AddressDTO();
        BeanUtils.copyProperties(entity, dto);
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
        }
        return dto;
    }
}
