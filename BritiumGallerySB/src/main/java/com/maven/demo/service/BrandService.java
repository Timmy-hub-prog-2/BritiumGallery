package com.maven.demo.service;

import com.maven.demo.entity.BrandEntity;
import com.maven.demo.repository.BrandRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BrandService {

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public List<BrandEntity> getAllBrands() {
        return brandRepository.findAllByOrderByIdAsc();
    }

    public Optional<BrandEntity> getBrandById(Long id) {
        return brandRepository.findById(id);
    }

    public BrandEntity createBrand(BrandEntity brand) {
        // Check for duplicate brand name (case-insensitive)
        Optional<BrandEntity> existingBrand = brandRepository.findByName(brand.getName());
        if (existingBrand.isPresent()) {
            throw new RuntimeException("Brand with name '" + brand.getName() + "' already exists");
        }
        return brandRepository.save(brand);
    }

    public void deleteBrand(Long id) {
        brandRepository.deleteById(id);
    }

    public BrandEntity saveBrand(BrandEntity brand) {
        return brandRepository.save(brand);
    }
}

