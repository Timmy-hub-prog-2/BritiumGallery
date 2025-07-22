package com.maven.demo.controller;

import com.maven.demo.dto.ShopAddressDTO;
import com.maven.demo.service.ShopAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/shopaddresses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ShopAddressController {
    private final ShopAddressService service;

    @PostMapping
    public ShopAddressDTO save(@Valid @RequestBody ShopAddressDTO dto) {
        return service.save(dto);
    }

    @GetMapping
    public List<ShopAddressDTO> findAll() {
        return service.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<ShopAddressDTO> findByUser(@PathVariable Long userId) {
        return service.findByUserId(userId);
    }

    @PutMapping("/{id}")
    public ShopAddressDTO update(@PathVariable Long id, @Valid @RequestBody ShopAddressDTO dto) {
        dto.setId(id);
        return service.update(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/user/{userId}/main/{addressId}")
    public void setMain(@PathVariable Long userId, @PathVariable Long addressId) {
        service.setMainAddress(userId, addressId);
    }
    @GetMapping("/main")
    public ShopAddressDTO getMainAddress() {
        return service.findMainAddress()
                .orElseThrow(() -> new RuntimeException("Main address not found"));
    }

}