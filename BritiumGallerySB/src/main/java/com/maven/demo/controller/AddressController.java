package com.maven.demo.controller;

import com.maven.demo.dto.AddressDTO;
import com.maven.demo.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    public ResponseEntity<AddressDTO> create(@Valid @RequestBody AddressDTO dto) {
        AddressDTO saved = addressService.save(dto);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AddressDTO>> getAll() {
        return ResponseEntity.ok(addressService.getAllAddresses());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AddressDTO>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(addressService.getAddressesByUserId(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDTO> update(@PathVariable Long id, @Valid @RequestBody AddressDTO dto) {
        AddressDTO updated = addressService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        addressService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Set Main Address Endpoint
    @PutMapping("/user/{userId}/main/{addressId}")
    public ResponseEntity<Void> setMainAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId) {

        addressService.setMainAddress(userId, addressId);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/user/{userId}/main")
    public ResponseEntity<AddressDTO> getMainAddressByUserId(@PathVariable Long userId) {
        AddressDTO mainAddress = addressService.getMainAddressByUserId(userId);
        return ResponseEntity.ok(mainAddress);
    }
}
