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

    // ✅ Update category
    @PutMapping("/update")
    public ResponseEntity<String> updateCategory(@RequestBody CategoryDTO dto) {
        catService.updateCategory(dto);
        return ResponseEntity.ok("Update success!");
    }

    // ✅ Delete category
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        catService.deleteCategory(id);
        return ResponseEntity.ok("Delete success!");
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


    // Optional: Get category by ID (for edit/view)
    // @GetMapping("/getbyid/{id}")
    // public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id){
    //     CategoryDTO catDto = catService.getById(id);
    //     return ResponseEntity.ok(catDto);
    // }

}
