package com.maven.demo.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.ProductRequestDTO;
import com.maven.demo.dto.ProductResponseDTO;
import com.maven.demo.dto.VariantDTO;
import com.maven.demo.service.CloudinaryUploadService;
import com.maven.demo.service.ProductService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/product")
public class ProductController {

    @Autowired
    ProductService productService;

    @Autowired
    private CloudinaryUploadService cloudinaryService;

    @PostMapping("/saveWithFiles")
    public ResponseEntity<String> saveProductWithFiles(
            @RequestPart("product") ProductRequestDTO dto,
            @RequestPart("basePhoto") MultipartFile basePhoto,
            @RequestPart(value = "variantPhotos", required = false) List<MultipartFile> variantPhotos
    ) throws IOException {

        // Upload base photo
        String basePhotoUrl = cloudinaryService.uploadToCloudinary(basePhoto, "products/base");
        dto.setBasePhotoUrl(basePhotoUrl);
        System.out.println("base photo url :"+basePhotoUrl);

        // Handle variant photos
        if (variantPhotos != null && !variantPhotos.isEmpty()) {
            System.out.println("Received " + variantPhotos.size() + " variant photos");

            // Upload all variant photos first
            List<String> variantPhotoUrls = variantPhotos.stream()
                    .map(photo -> {
                        try {
                            return cloudinaryService.uploadToCloudinary(photo, "products/variants");
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to upload variant photo", e);
                        }
                    })
                    .toList();

            // Assign photo URLs to variants
            for (int i = 0; i < dto.getVariants().size(); i++) {
                if (i < variantPhotoUrls.size()) {
                    String variantPhotoUrl = variantPhotoUrls.get(i);
                    System.out.println("variant photo url :"+variantPhotoUrl);
                    dto.getVariants().get(i).setPhotoUrl(variantPhotoUrl);
                }
            }
        }

        // Save product, variants, and attribute options
        productService.saveProductWithVariants(dto);

        return ResponseEntity.ok("Saved with files");
    }


    @GetMapping("/by-category/{categoryId}")
    public ResponseEntity<List<ProductResponseDTO>> getProductsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }

    @GetMapping("/getProductDetail/{productId}")
    public ResponseEntity<ProductResponseDTO> getProductDetail(@PathVariable Long productId) {
        ProductResponseDTO dto = productService.getProductDetailById(productId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{productId}/breadcrumb")
    public ResponseEntity<List<String>> getProductBreadcrumb(@PathVariable Long productId) {
        return ResponseEntity.ok(productService.getProductBreadcrumb(productId));
    }

    @PutMapping("/update/{productId}")
    public ResponseEntity<ProductResponseDTO> updateProduct(
            @PathVariable Long productId,
            @RequestPart("product") ProductRequestDTO dto,
            @RequestPart(value = "basePhoto", required = false) MultipartFile basePhoto
    ) throws IOException {
        try {
            if (basePhoto != null) {
                String basePhotoUrl = cloudinaryService.uploadToCloudinary(basePhoto, "products/base");
                dto.setBasePhotoUrl(basePhotoUrl);
            }
            ProductResponseDTO updatedProduct = productService.updateProduct(productId, dto);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/variants/{variantId}/with-photos")
    public ResponseEntity<ProductResponseDTO> updateVariantWithPhotos(
            @PathVariable Long variantId,
            @RequestPart("variant") VariantDTO variant,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) throws IOException {
        try {
            List<String> newPhotoUrls = new ArrayList<>();
            if (photos != null && !photos.isEmpty()) {
                newPhotoUrls = photos.stream()
                        .map(photo -> {
                            try {
                                return cloudinaryService.uploadToCloudinary(photo, "products/variants");
                            } catch (IOException e) {
                                throw new RuntimeException("Failed to upload variant photo", e);
                            }
                        })
                        .toList();
            }
            
            ProductResponseDTO updatedProduct = productService.updateVariant(variantId, variant, newPhotoUrls);
            System.out.println("Received VariantDTO in controller: " + variant);
            if (variant.getAttributes() != null) {
                System.out.println("VariantDTO attributes received: " + variant.getAttributes());
            } else {
                System.out.println("VariantDTO attributes are null or empty.");
            }
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/variants/{variantId}")
    public ResponseEntity<Void> deleteVariant(@PathVariable Long variantId) {
        productService.deleteVariant(variantId);
        return ResponseEntity.ok().build();
    }

    //        @GetMapping("/by-parent-category/{parentId}")
    //        public List<ProductResponseDTO> getProductsByParentCategory(@PathVariable Long parentId) {
    //            return productService.getProductsByParentCategory(parentId);
    //        }


}
