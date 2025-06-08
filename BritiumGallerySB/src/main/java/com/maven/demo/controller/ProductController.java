package com.maven.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.ProductRequestDTO;
import com.maven.demo.dto.ProductResponseDTO;
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





    //        @GetMapping("/by-parent-category/{parentId}")
    //        public List<ProductResponseDTO> getProductsByParentCategory(@PathVariable Long parentId) {
    //            return productService.getProductsByParentCategory(parentId);
    //        }


}
