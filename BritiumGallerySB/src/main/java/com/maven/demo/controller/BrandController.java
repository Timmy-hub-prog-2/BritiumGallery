package com.maven.demo.controller;


import com.maven.demo.service.BrandService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.maven.demo.entity.BrandEntity;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
@CrossOrigin(origins = "*") // allow Angular access
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    // GET all brands
    @GetMapping
    public ResponseEntity<List<BrandEntity>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    // GET brand by ID
    @GetMapping("/{id}")
    public ResponseEntity<BrandEntity> getBrand(@PathVariable Long id) {
        return brandService.getBrandById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST create new brand
    @PostMapping
    public ResponseEntity<?> createBrand(@RequestBody BrandEntity brand) {
        try {
            BrandEntity createdBrand = brandService.createBrand(brand);
            return ResponseEntity.ok(createdBrand);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(409).body("Brand with name '" + brand.getName() + "' already exists");
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE brand
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }

    // PUT update brand
    @PutMapping("/{id}")
    public ResponseEntity<BrandEntity> updateBrand(@PathVariable Long id, @RequestBody BrandEntity updatedBrand) {
        return brandService.getBrandById(id)
                .map(brand -> {
                    brand.setName(updatedBrand.getName());
                    BrandEntity savedBrand = brandService.saveBrand(brand);
                    return ResponseEntity.ok(savedBrand);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}   
