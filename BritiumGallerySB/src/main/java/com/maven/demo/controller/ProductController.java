package com.maven.demo.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.PurchaseHistoryResponseDTO;
import com.maven.demo.dto.ReduceStockHistoryResponseDTO;
import com.maven.demo.dto.ReduceStockRequestDTO;
import com.maven.demo.dto.VariantDTO;
import com.maven.demo.dto.VariantResponseDTO;
import com.maven.demo.entity.BrandEntity;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.repository.BrandRepository;
import com.maven.demo.repository.ProductRepository;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.service.CloudinaryUploadService;
import com.maven.demo.service.ExcelService;
import com.maven.demo.service.ProductService;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/product")
public class ProductController {

    @Autowired
    ProductService productService;

    @Autowired
    private CloudinaryUploadService cloudinaryService;

    @Autowired
    private ExcelService excelService;


    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ProductRepository productRepository;


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
    public ResponseEntity<?> deleteVariant(@PathVariable Long variantId) {
        try {
            productService.deleteVariant(variantId);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Delete success!"));
        } catch (RuntimeException ex) {
            ex.printStackTrace();
            if (ex.getMessage() != null && ex.getMessage().contains("VARIANT_REFERENCED")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of(
                        "success", false,
                        "code", "VARIANT_REFERENCED",
                        "message", "This variant is referenced by an order or refund and cannot be deleted. You can only hide it."
                    ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("success", false, "message", "Failed to delete variant"));
        }
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
    public ResponseEntity<?> deleteProduct(@PathVariable Long productId) {
        try {
            productService.deleteProduct(productId);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Delete success!"));
        } catch (RuntimeException ex) {
            ex.printStackTrace();
            // Check for product referenced error
            if (ex.getMessage() != null && (ex.getMessage().contains("PRODUCT_PURCHASED") || ex.getMessage().contains("SOFT_DELETE"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of(
                        "success", false,
                        "code", "PRODUCT_PURCHASED",
                        "message", "This product has already been purchased by a customer. You can only hide it, not delete it completely."
                    ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("success", false, "message", "Failed to delete product"));
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

    @GetMapping("/variants/{variantId}/reduce-stock-history")
    public ResponseEntity<List<ReduceStockHistoryResponseDTO>> getReduceStockHistory(@PathVariable Long variantId) {
        List<ReduceStockHistoryResponseDTO> reduceStockHistory = productService.getReduceStockHistory(variantId);
        return ResponseEntity.ok(reduceStockHistory);
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
    @GetMapping("/export-template")
    public void exportProductTemplate(@RequestParam Long categoryId, HttpServletResponse response) throws IOException {
        List<String> dynamicAttrs = productService.getColumnsByCategoryId(categoryId); // only variant attributes
        List<BrandEntity> brands = brandRepository.findAllByOrderByIdAsc();

        // Remove default fields if present in dynamic list
        dynamicAttrs.removeIf(attr -> List.of("name", "description", "brand", "rating", "price", "stock", "purchaseprice")
                .contains(attr.toLowerCase()));

        // ✅ Final column order: name, description, brand, [attributes...], rating...
        List<String> columns = new ArrayList<>();
        columns.add("name");           // A
        columns.add("description");    // B
        columns.add("brand");          // C
        columns.addAll(dynamicAttrs);  // D+...
        columns.add("rating");
        columns.add("price");
        columns.add("stock");
        columns.add("purchaseprice");

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Product Template");

        // 🧾 Header row
        Row header = sheet.createRow(0);
        for (int i = 0; i < columns.size(); i++) {
            header.createCell(i).setCellValue(columns.get(i));
        }

        // 🧾 Dropdown for brand in the correct column
        int brandColIndex = columns.indexOf("brand"); // now C = index 2
        DataValidationHelper helper = sheet.getDataValidationHelper();
        DataValidationConstraint constraint = helper.createExplicitListConstraint(
                brands.stream().map(BrandEntity::getName).toArray(String[]::new)
        );
        CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, brandColIndex, brandColIndex);
        DataValidation validation = helper.createValidation(constraint, addressList);
        validation.setSuppressDropDownArrow(true);
        sheet.addValidationData(validation);

        // 📤 Download setup
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=category_" + categoryId + "_template.xlsx");

        workbook.write(response.getOutputStream());
        workbook.close();
    }


    @PostMapping("/upload-products")
    public ResponseEntity<Map<String, Object>> uploadExcel(@RequestParam("file") MultipartFile file,
                                                           @RequestParam("categoryId") Long categoryId,
                                                           @RequestParam("adminId") Long adminId) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File is empty"));
        }

        excelService.parseAndInsertExcelData(file, categoryId, adminId);
        // Pass categoryId
        return ResponseEntity.ok(Map.of("success", true, "message", "Upload successful"));
    }

    @GetMapping("/{productId}/recommendations")
    public ResponseEntity<List<ProductSearchResultDTO>> getRecommendedProducts(@PathVariable Long productId, @RequestParam(defaultValue = "8") int limit) {
        List<ProductSearchResultDTO> recommendations = productService.getRecommendedProducts(productId, limit);
        return ResponseEntity.ok(recommendations);
    }

    @PutMapping("/hide/{id}")
    public ResponseEntity<?> hideProduct(@PathVariable Long id) {
        ProductEntity product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Collections.singletonMap("success", false));
        }
        product.setStatus(0);
        productRepository.save(product);
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("success", true);
        resp.put("message", "Product hidden successfully");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/unhide/{id}")
    public ResponseEntity<?> unhideProduct(@PathVariable Long id) {
        ProductEntity product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Collections.singletonMap("success", false));
        }
        product.setStatus(1);
        productRepository.save(product);
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("success", true);
        resp.put("message", "Product unhidden successfully");
        return ResponseEntity.ok(resp);
    }

}
