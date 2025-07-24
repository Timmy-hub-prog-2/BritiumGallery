package com.maven.demo.controller;

import com.maven.demo.dto.AttributeDTO;
import com.maven.demo.dto.CategoryDTO;
import com.maven.demo.service.AttributeService;
import com.maven.demo.service.CategoryService;
import com.maven.demo.service.CloudinaryUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import com.maven.demo.entity.CategoryEntity;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.repository.CategoryRepository;
import com.maven.demo.repository.ProductRepository;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/category")
public class CategoryController {

    @Autowired
    private CategoryService catService;

    @Autowired
    private AttributeService attributeService;

    @Autowired
    private CloudinaryUploadService cloudinaryService;

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;

    // ✅ Get category path from root to current category
    @GetMapping("/path/{id}")
    public ResponseEntity<List<CategoryDTO>> getCategoryPath(@PathVariable Long id) {
        List<CategoryDTO> path = catService.getCategoryPath(id);
        return ResponseEntity.ok(path);
    }

    // ✅ Create category with attributes
    @PostMapping(value = "/save", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> insertCategory(
            @RequestPart("category") CategoryDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            System.out.println("Received category: " + dto);
            if (image != null && !image.isEmpty()) {
                System.out.println("Image received: " + image.getOriginalFilename());
                String imageUrl = cloudinaryService.uploadToCloudinary(image, "category");
                System.out.println("Uploaded image URL: " + imageUrl);
                dto.setImage_url(imageUrl);
            } else {
                System.out.println("No image file uploaded.");
            }

            catService.insertCategory(dto);
            return ResponseEntity.ok("Create success!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create category: " + e.getMessage());
        }
    }

    // ✅ Get all top-level categories (no parent)
    @GetMapping("/list")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> dtoList = catService.getAllCategories();
        return ResponseEntity.ok(dtoList);
    }

    // ✅ Get subcategories by parent ID
    @GetMapping("/getSubCat/{id}")
    public ResponseEntity<List<CategoryDTO>> getSubCategories(@PathVariable Long id) {
        List<CategoryDTO> dtoList = catService.getSubCategories(id);
        return ResponseEntity.ok(dtoList);
    }

    // ✅ Update category with optional image
    @PutMapping(value = "/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryDTO> updateCategory(
            @RequestPart("category") CategoryDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            System.out.println("Updating category: " + dto.getId() + ", Current image URL: " + dto.getImage_url());
            
            if (image != null && !image.isEmpty()) {
                System.out.println("New image received: " + image.getOriginalFilename());
                String imageUrl = cloudinaryService.uploadToCloudinary(image, "category");
                System.out.println("New uploaded image URL: " + imageUrl);
                dto.setImage_url(imageUrl);
            } else {
                System.out.println("No new image uploaded, keeping existing image URL: " + dto.getImage_url());
            }

            CategoryDTO updatedCategory = catService.updateCategory(dto);
            System.out.println("Category updated successfully. New image URL: " + updatedCategory.getImage_url());
            
            return ResponseEntity.ok(updatedCategory);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    // ✅ Delete category
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            catService.deleteCategory(id);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Delete success!"));
        } catch (RuntimeException ex) {
            ex.printStackTrace(); // Log all exceptions for debugging
            if ("CATEGORY_PURCHASED".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of(
                        "success", false,
                        "code", "CATEGORY_PURCHASED",
                        "message", "This category has already been purchased by a customer. You can only hide it, not delete it completely."
                    ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("success", false, "message", "Failed to delete category"));
        }
    }

    // ✅ Get category by ID (for editing)
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        CategoryDTO dto = catService.getCategoryById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/attributes/{categoryId}")
    public ResponseEntity<List<AttributeDTO>> getAttributesByCategory(@PathVariable Long categoryId) {
        List<AttributeDTO> attributes = attributeService.getAttributesForCategory(categoryId);
        return ResponseEntity.ok(attributes);
    }

    @PutMapping("/hide/{id}")
    public ResponseEntity<?> hideCategory(@PathVariable Long id) {
        CategoryEntity category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Collections.singletonMap("success", false));
        }
        // Recursively hide category, subcategories, and products
        hideCategoryRecursive(category);
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("success", true);
        resp.put("message", "Category and its subcategories/products hidden successfully");
        return ResponseEntity.ok(resp);
    }

    private void hideCategoryRecursive(CategoryEntity category) {
        category.setStatus(0);
        categoryRepository.save(category);
        // Hide all products in this category
        java.util.List<ProductEntity> products = productRepository.findByCategoryId(category.getId());
        for (ProductEntity product : products) {
            product.setStatus(0);
            productRepository.save(product);
        }
        // Hide all subcategories recursively
        java.util.List<CategoryEntity> subcategories = categoryRepository.findByParentCategoryId(category.getId());
        for (CategoryEntity sub : subcategories) {
            hideCategoryRecursive(sub);
        }
    }

    @PutMapping("/unhide/{id}")
    public ResponseEntity<?> unhideCategory(@PathVariable Long id) {
        CategoryEntity category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Collections.singletonMap("success", false));
        }
        // Recursively unhide category, subcategories, and products
        unhideCategoryRecursive(category);
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("success", true);
        resp.put("message", "Category and its subcategories/products unhidden successfully");
        return ResponseEntity.ok(resp);
    }

    private void unhideCategoryRecursive(CategoryEntity category) {
        category.setStatus(1);
        categoryRepository.save(category);
        // Unhide all products in this category
        java.util.List<ProductEntity> products = productRepository.findByCategoryId(category.getId());
        for (ProductEntity product : products) {
            product.setStatus(1);
            productRepository.save(product);
        }
        // Unhide all subcategories recursively
        java.util.List<CategoryEntity> subcategories = categoryRepository.findByParentCategoryId(category.getId());
        for (CategoryEntity sub : subcategories) {
            unhideCategoryRecursive(sub);
        }
    }
}
