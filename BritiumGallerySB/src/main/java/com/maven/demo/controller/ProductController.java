package com.maven.demo.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.AddStockRequestDTO;
import com.maven.demo.dto.PriceHistoryResponseDTO;
import com.maven.demo.dto.ProductRequestDTO;
import com.maven.demo.dto.ProductResponseDTO;
import com.maven.demo.dto.PurchaseHistoryResponseDTO;
import com.maven.demo.dto.ReduceStockRequestDTO;
import com.maven.demo.dto.VariantDTO;
import com.maven.demo.dto.VariantResponseDTO;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.repository.ProductVariantRepository;
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



    @Autowired
    private ProductVariantRepository variantRepository;

    @PostMapping("/saveWithFiles")
    public ResponseEntity<String> saveProductWithFiles(
            @RequestPart("product") ProductRequestDTO dto,
            @RequestPart("basePhoto") MultipartFile basePhoto,
            @RequestParam MultiValueMap<String, MultipartFile> allFiles // Changed to MultiValueMap
    ) throws IOException {

        // Upload base photo
        String basePhotoUrl = cloudinaryService.uploadToCloudinary(basePhoto, "products/base");
        dto.setBasePhotoUrl(basePhotoUrl);

        // Process each variant's photos
        for (int i = 0; i < dto.getVariants().size(); i++) {
            String variantKey = "variant_" + i;
            List<MultipartFile> variantFiles = allFiles.get(variantKey);
            List<String> photoUrls = new ArrayList<>();
            
            if (variantFiles != null) {
                for (MultipartFile file : variantFiles) {
                    String photoUrl = cloudinaryService.uploadToCloudinary(file, "products/variants");
                    photoUrls.add(photoUrl);
                }
            }
            
            // Set the uploaded photo URLs for this specific variant
            dto.getVariants().get(i).setImageUrls(photoUrls);
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

    /**
     * Update product details, including name, description, rating, brand, and base photo.
     * Accepts multipart/form-data with:
     *   - product: ProductRequestDTO (JSON, must include brandId if updating brand)
     *   - basePhoto: MultipartFile (optional, for updating base photo)
     */
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
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos,
            @RequestParam(value = "adminId", required = false) Long adminId
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
            
            ProductResponseDTO updatedProduct = productService.updateVariant(variantId, variant, newPhotoUrls, adminId);
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

    @PostMapping("/variants/{productId}/with-photos")
    public ResponseEntity<ProductResponseDTO> addVariantWithPhotos(
            @PathVariable Long productId,
            @RequestPart("variant") VariantDTO variant,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos,
            @RequestParam(value = "adminId", required = false) Long adminId
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
            ProductResponseDTO updatedProduct = productService.addVariant(productId, variant, newPhotoUrls, adminId);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        try {
            productService.deleteProduct(productId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/filtered/{categoryId}")
    public ResponseEntity<List<ProductResponseDTO>> getFilteredProducts(
            @PathVariable Long categoryId,
            @RequestParam(required = false) MultiValueMap<String, String> filtersMap) {

        System.out.println("filtersMap received in controller: " + filtersMap);

        Map<String, List<String>> filters = new HashMap<>();
        if (filtersMap != null) {
            for (Map.Entry<String, List<String>> entry : filtersMap.entrySet()) {
                System.out.println("Key: " + entry.getKey() + ", Value type: " + entry.getValue().getClass().getName() + ", Value: " + entry.getValue());
                filters.put(entry.getKey(), entry.getValue());
            }
        }
        
        List<ProductResponseDTO> products = productService.getFilteredProducts(categoryId, filters);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{categoryId}/attribute-options")
    public ResponseEntity<Map<String, Set<String>>> getAttributeOptionsForCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getCategoryAttributeOptions(categoryId));
    }

    @GetMapping("/variants/{variantId}/latest-purchase-price")
    public ResponseEntity<Integer> getLatestPurchasePrice(@PathVariable Long variantId) {
        Integer price = productService.getLatestPurchasePrice(variantId);
        return ResponseEntity.ok(price);
    }

    @PostMapping("/variants/{variantId}/add-stock")
    public ResponseEntity<VariantResponseDTO> addStock(
            @PathVariable Long variantId,
            @RequestBody AddStockRequestDTO request,
            @RequestParam(value = "adminId", required = false) Long adminId) {
        VariantResponseDTO response = productService.addStock(variantId, request, adminId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/variants/{variantId}/reduce-stock")
    public ResponseEntity<VariantResponseDTO> reduceStock(
            @PathVariable Long variantId,
            @RequestBody ReduceStockRequestDTO request,
            @RequestParam(value = "adminId", required = false) Long adminId) {
        VariantResponseDTO response = productService.reduceStock(variantId, request, adminId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/variants/{variantId}/price-history")
    public ResponseEntity<List<PriceHistoryResponseDTO>> getPriceHistory(@PathVariable Long variantId) {
        List<PriceHistoryResponseDTO> priceHistory = productService.getPriceHistory(variantId);
        return ResponseEntity.ok(priceHistory);
    }

    @GetMapping("/variants/{variantId}/purchase-history")
    public ResponseEntity<List<PurchaseHistoryResponseDTO>> getPurchaseHistory(@PathVariable Long variantId) {
        List<PurchaseHistoryResponseDTO> purchaseHistory = productService.getPurchaseHistory(variantId);
        return ResponseEntity.ok(purchaseHistory);
    }

    @GetMapping("/variants/{variantId}")
    public ResponseEntity<VariantResponseDTO> getVariantById(@PathVariable Long variantId) {
        VariantResponseDTO variant = productService.getVariantById(variantId);
        return ResponseEntity.ok(variant);
    }

    //        @GetMapping("/by-parent-category/{parentId}")
    //        public List<ProductResponseDTO> getProductsByParentCategory(@PathVariable Long parentId) {
    //            return productService.getProductsByParentCategory(parentId);
    //        }

    @GetMapping("/variants")
    public ResponseEntity<List<Map<String, Object>>> getAllVariants() {
        List<ProductVariantEntity> variants = variantRepository.findAll();
        List<Map<String, Object>> dtos = variants.stream().map(variant -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", variant.getId());
            dto.put("productId", variant.getProduct() != null ? variant.getProduct().getId() : null);

            StringBuilder nameBuilder = new StringBuilder();
            if (variant.getProduct() != null) {
                nameBuilder.append(variant.getProduct().getName());
            }
            if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                nameBuilder.append(" - ");
                nameBuilder.append(
                    variant.getAttributeValues().stream()
                        .map(attr -> attr.getAttribute().getName() + ": " + attr.getValue())
                        .reduce((a, b) -> a + ", " + b).orElse("")
                );
            }
            dto.put("name", nameBuilder.toString());
            dto.put("price", variant.getPrice());
            dto.put("stock", variant.getStock());
            dto.put("sku", variant.getSku());

            // Add imageUrls
            dto.put("imageUrls", variant.getImages().stream()
                .map(img -> img.getImageUrl())
                .toList());

            // Add attributes
            dto.put("attributes", variant.getAttributeValues().stream()
                .collect(java.util.stream.Collectors.toMap(
                    vav -> vav.getAttribute().getName(),
                    vav -> vav.getValue()
                )));

            return dto;
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProductResponseDTO>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{productId}/variants")
    public ResponseEntity<List<Map<String, Object>>> getVariantsByProduct(@PathVariable Long productId) {
        List<ProductVariantEntity> variants = variantRepository.findByProductId(productId);
        System.out.println("Variants for productId " + productId + ": " + variants.size());
        for (ProductVariantEntity variant : variants) {
            System.out.println("Variant id: " + variant.getId());
            if (variant.getAttributeValues() != null) {
                for (var attr : variant.getAttributeValues()) {
                    System.out.println("  Attribute: " + attr.getAttribute().getName() + " = " + attr.getValue());
                }
            }
        }
        List<Map<String, Object>> dtos = variants.stream().map(variant -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", variant.getId());
            StringBuilder nameBuilder = new StringBuilder();
            if (variant.getProduct() != null) {
                nameBuilder.append(variant.getProduct().getName());
            }
            // Only add Brand attribute
            if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                variant.getAttributeValues().stream()
                    .filter(attr -> "Brand".equalsIgnoreCase(attr.getAttribute().getName()))
                    .findFirst()
                    .ifPresent(brandAttr -> nameBuilder.append(" - Brand: ").append(brandAttr.getValue()));
            }
            dto.put("name", nameBuilder.toString());
            dto.put("price", variant.getPrice());
            dto.put("stock", variant.getStock());
            dto.put("sku", variant.getSku());
            System.out.println("Variant DTO: " + dto);
            return dto;
        }).toList();
        System.out.println("Returning DTOs: " + dtos);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{categoryId}/brands")
    public ResponseEntity<List<String>> getBrandsForCategory(@PathVariable Long categoryId) {
        List<String> brands = productService.getBrandsForCategory(categoryId);
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/{categoryId}/price-range")
    public ResponseEntity<Map<String, Integer>> getMinMaxPriceForCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getMinMaxPriceForCategory(categoryId));
    }

}
