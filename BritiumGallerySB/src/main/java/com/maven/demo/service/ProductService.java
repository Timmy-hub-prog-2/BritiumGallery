package com.maven.demo.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.maven.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.AddStockRequestDTO;
import com.maven.demo.dto.AttributeOptionDTO;
import com.maven.demo.dto.PriceHistoryResponseDTO;
import com.maven.demo.dto.ProductRequestDTO;
import com.maven.demo.dto.ProductResponseDTO;
import com.maven.demo.dto.PurchaseHistoryResponseDTO;
import com.maven.demo.dto.VariantDTO;
import com.maven.demo.dto.VariantResponseDTO;
import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.AttributeOptions;
import com.maven.demo.entity.CategoryEntity;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.ProductVariantImage;
import com.maven.demo.entity.ProductVariantPriceHistoryEntity;
import com.maven.demo.entity.PurchaseHistoryEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.VariantAttributeValueEntity;

import jakarta.transaction.Transactional;

@Service
public class ProductService {

    @Autowired
    private CategoryRepository catRepo;

    @Autowired
    private ProductRepository proRepo;

    @Autowired
    private AttributeRepository attriRepo;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private AttributeOptionRepository attributeOptionRepository;

    @Autowired
    private PurchaseHistoryRepository purchaseHistoryRepository;

    @Autowired
    private ProductVariantPriceHistoryRepository priceHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private BrandRepository brandRepository;

    @Transactional
    public void saveProductWithVariants(ProductRequestDTO dto) {
        // Create and save the Product
        ProductEntity product = new ProductEntity();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCategory(catRepo.findById(dto.getCategoryId()).orElseThrow());
        product.setAdmin_id(dto.getAdminId());
        product.setBasePhotoUrl(dto.getBasePhotoUrl());
        product.setCreated_at(LocalDateTime.now());
        product.setRating(dto.getRating());

        // Set brand if provided
        if (dto.getBrandId() != null) {
            product.setBrand(brandRepository.findById(dto.getBrandId()).orElse(null));
        }
        proRepo.save(product);

        // Handle Variants
        String prefix = product.getName().replaceAll("\\s+", "").toUpperCase();
        prefix = prefix.length() > 4 ? prefix.substring(0, 4) : prefix;
        Long productId = product.getId(); // after save
        int skuCounter = 1;

        for (VariantDTO varDto : dto.getVariants()) {
            ProductVariantEntity variant = new ProductVariantEntity();
            variant.setProduct(product);
            variant.setPrice(varDto.getPrice());
            variant.setStock(varDto.getStock());
            variant.setAdmin_id(dto.getAdminId());

            // Set Attributes
            List<VariantAttributeValueEntity> attrValues = new ArrayList<>();
            if (varDto.getAttributes() != null) {
                for (Map.Entry<String, String> entry : varDto.getAttributes().entrySet()) {
                    AttributeEntity attr = attriRepo.findByNameAndCategory(entry.getKey(), product.getCategory())
                            .orElseThrow(() -> new RuntimeException("Attribute not found: " + entry.getKey()));
                    VariantAttributeValueEntity val = new VariantAttributeValueEntity();
                    val.setAttribute(attr);
                    val.setValue(entry.getValue());
                    val.setProductVariant(variant);
                    attrValues.add(val);
                }
            }
            variant.setAttributeValues(attrValues);

            // Set SKU
            String sku = String.format("%s%d%03d", prefix, productId, skuCounter++);
            variant.setSku(sku);

            // Save variant first to get the ID
            variantRepository.save(variant);
            
            // Create a record in the purchase history for initial stock
            PurchaseHistoryEntity purchase = new PurchaseHistoryEntity();
            purchase.setVariant(variant);
            purchase.setPurchasePrice(varDto.getPurchasePrice());
            purchase.setQuantity(varDto.getStock());
            purchase.setRemainingQuantity(varDto.getStock());
            purchaseHistoryRepository.save(purchase);

            // Create initial price history record for the selling price
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(varDto.getPrice()); // Store the initial selling price
            priceHistory.setPriceDate(LocalDateTime.now());
            
            // Set the admin who created the product
            if (dto.getAdminId() != null) {
                UserEntity admin = userRepository.findById(dto.getAdminId())
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            
            priceHistoryRepository.save(priceHistory);

            // Save image if provided
            if (varDto.getImageUrls() != null && !varDto.getImageUrls().isEmpty()) {
                for (String imageUrl : varDto.getImageUrls()) {
                    ProductVariantImage image = new ProductVariantImage();
                    image.setVariant(variant);
                    image.setImageUrl(imageUrl); // Use each photo URL
                    image.setCreatedAt(LocalDateTime.now());
                    variant.getImages().add(image);
                }
            }

            // Save again if image is added (if mapped with cascade this can be avoided)
            variantRepository.save(variant);
            if (dto.getAttributeOptions() != null) {
                for (AttributeOptionDTO optionDTO : dto.getAttributeOptions()) {
                    AttributeEntity attribute = attriRepo.findById(optionDTO.getAttributeId())
                            .orElseThrow(() -> new RuntimeException("Attribute not found"));

                    // Delete existing options for this attribute
                    attributeOptionRepository.deleteByAttributeId(attribute.getId());

                    // Save new options
                    for (String optionValue : optionDTO.getOptions()) {
                        AttributeOptions option = new AttributeOptions();
                        option.setAttribute(attribute);
                        option.setValue(optionValue);
                        attributeOptionRepository.save(option);
                    }
                }
            }
        }
    }

    public List<ProductResponseDTO> getProductsByCategory(Long categoryId) {
        List<ProductEntity> products = proRepo.findByCategoryId(categoryId);

        return products.stream().map(product -> {
            ProductResponseDTO dto = new ProductResponseDTO();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setBasePhotoUrl(product.getBasePhotoUrl());
            dto.setDescription(product.getDescription());
            dto.setRating(product.getRating());
            dto.setCategoryId(product.getCategory().getId());
            dto.setAdminId(product.getAdmin_id());

            List<VariantResponseDTO> variantDTOs = product.getVariants().stream().map(variant -> {
                VariantResponseDTO varDTO = new VariantResponseDTO();
                varDTO.setId(variant.getId());
                varDTO.setPrice(variant.getPrice());
                varDTO.setStock(variant.getStock());

                Map<String, String> attrMap = new HashMap<>();
                for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                    attrMap.put(vav.getAttribute().getName(), vav.getValue());
                }
                varDTO.setAttributes(attrMap);

                return varDTO;
            }).toList();

            dto.setVariants(variantDTOs);
            return dto;
        }).toList();
    }

    public ProductResponseDTO getProductDetailById(Long productId) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setRating(product.getRating());
        dto.setCategoryId(product.getCategory().getId());
        dto.setAdminId(product.getAdmin_id());
        dto.setBasePhotoUrl(product.getBasePhotoUrl());

        List<VariantResponseDTO> variantDTOs = product.getVariants().stream().map(variant -> {
            VariantResponseDTO varDTO = new VariantResponseDTO();
            varDTO.setId(variant.getId());
            varDTO.setPrice(variant.getPrice());
            varDTO.setStock(variant.getStock());
            varDTO.setSku(variant.getSku());
            // Attributes
            Map<String, String> attrMap = new HashMap<>();
            for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                attrMap.put(vav.getAttribute().getName(), vav.getValue());
            }
            varDTO.setAttributes(attrMap);

            // Images
            List<String> imageUrls = new ArrayList<>();
            for (ProductVariantImage image : variant.getImages()) {
                imageUrls.add(image.getImageUrl());
            }
            varDTO.setImageUrls(imageUrls);

            return varDTO;
        }).toList();

        dto.setVariants(variantDTOs);
        return dto;
    }

    @Transactional
    public List<String> getProductBreadcrumb(Long productId) {
        Optional<ProductEntity> productOpt = proRepo.findById(productId);
        if (productOpt.isEmpty()) {
            return new ArrayList<>();
        }

        ProductEntity product = productOpt.get();
        List<String> breadcrumb = new ArrayList<>();

        // Start with category path
        CategoryEntity category = product.getCategory();
        while (category != null) {
            breadcrumb.add(category.getName());
            category = category.getParentCategory();
        }

        Collections.reverse(breadcrumb);

        // Add product name at the end
        breadcrumb.add(product.getName());

        return breadcrumb;
    }

    @Transactional
    public ProductResponseDTO updateProduct(Long productId, ProductRequestDTO dto) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Update basic product details
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        if (dto.getBasePhotoUrl() != null) {
            product.setBasePhotoUrl(dto.getBasePhotoUrl());
        }
        product.setRating(dto.getRating());

        proRepo.save(product);

        // Convert to response DTO
        return convertToProductResponseDTO(product);
    }

    @Transactional
    public ProductResponseDTO updateVariant(Long variantId, VariantDTO dto, List<String> newPhotoUrls, Long adminId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // Check if price has changed
        boolean priceChanged = variant.getPrice() != dto.getPrice();
        Integer oldPrice = variant.getPrice();

        // Update basic variant details
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());

        // If price changed, create a price history record
        if (priceChanged) {
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(dto.getPrice()); // Store the old price
            priceHistory.setPriceDate(LocalDateTime.now());
            
            // Set the admin who made the change
            if (adminId != null) {
                UserEntity admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            
            priceHistoryRepository.save(priceHistory);
        }

        // Handle image updates
        // 1. Delete images marked for removal
        if (dto.getImageUrlsToDelete() != null && !dto.getImageUrlsToDelete().isEmpty()) {
            for (String url : dto.getImageUrlsToDelete()) {
                variant.getImages().removeIf(image -> image.getImageUrl().equals(url));
            }
        }

        // 2. Add new photos uploaded
        if (newPhotoUrls != null && !newPhotoUrls.isEmpty()) {
            for (String url : newPhotoUrls) {
                ProductVariantImage image = new ProductVariantImage();
                image.setVariant(variant);
                image.setImageUrl(url);
                image.setCreatedAt(LocalDateTime.now());
                variant.getImages().add(image);
            }
        }

        // Update attributes
        if (dto.getAttributes() != null) {
            // Clear existing attributes using the helper method
            variant.clearAttributeValues();
            
            // Add new attributes
            for (Map.Entry<String, String> entry : dto.getAttributes().entrySet()) {
                AttributeEntity attr = attriRepo.findByNameAndCategory(entry.getKey(), variant.getProduct().getCategory())
                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + entry.getKey()));
                VariantAttributeValueEntity val = new VariantAttributeValueEntity();
                val.setAttribute(attr);
                val.setValue(entry.getValue());
                variant.addAttributeValue(val);
            }
        }

        variantRepository.save(variant);

        // Return updated product
        return getProductDetailById(variant.getProduct().getId());
    }

    @Transactional
    public void deleteVariant(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        variantRepository.delete(variant);
    }

    @Transactional
    public ProductResponseDTO addVariant(Long productId, VariantDTO dto, List<String> newPhotoUrls) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductVariantEntity variant = new ProductVariantEntity();
        variant.setProduct(product);
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());
        variant.setAdmin_id(product.getAdmin_id());

        // Handle attributes
        if (dto.getAttributes() != null) {
            List<VariantAttributeValueEntity> attrValues = new ArrayList<>();
            for (Map.Entry<String, String> entry : dto.getAttributes().entrySet()) {
                AttributeEntity attr = attriRepo.findByNameAndCategory(entry.getKey(), product.getCategory())
                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + entry.getKey()));
                VariantAttributeValueEntity val = new VariantAttributeValueEntity();
                val.setAttribute(attr);
                val.setValue(entry.getValue());
                val.setProductVariant(variant);
                attrValues.add(val);
            }
            variant.setAttributeValues(attrValues);
        }

        // Handle photos
        if (newPhotoUrls != null && !newPhotoUrls.isEmpty()) {
            for (String url : newPhotoUrls) {
                ProductVariantImage image = new ProductVariantImage();
                image.setVariant(variant);
                image.setImageUrl(url);
                image.setCreatedAt(LocalDateTime.now());
                variant.getImages().add(image);
            }
        }

        variantRepository.save(variant);
        return convertToProductResponseDTO(product);
    }

    private ProductResponseDTO convertToProductResponseDTO(ProductEntity product) {
        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setRating(product.getRating());
        dto.setCategoryId(product.getCategory().getId());
        dto.setAdminId(product.getAdmin_id());
        dto.setBasePhotoUrl(product.getBasePhotoUrl());

        List<VariantResponseDTO> variantDTOs = product.getVariants().stream().map(variant -> {
            VariantResponseDTO varDTO = new VariantResponseDTO();
            varDTO.setId(variant.getId());
            varDTO.setPrice(variant.getPrice());
            varDTO.setStock(variant.getStock());
            varDTO.setSku(variant.getSku());

            Map<String, String> attrMap = new HashMap<>();
            for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                attrMap.put(vav.getAttribute().getName(), vav.getValue());
            }
            varDTO.setAttributes(attrMap);

            List<String> imageUrls = variant.getImages().stream()
                    .map(ProductVariantImage::getImageUrl)
                    .toList();
            varDTO.setImageUrls(imageUrls);

            return varDTO;
        }).toList();

        dto.setVariants(variantDTOs);
        return dto;
    }

    @Transactional
    public void deleteProduct(Long productId) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
        
        // Delete all variants and their associated data first
        for (ProductVariantEntity variant : product.getVariants()) {
            variantRepository.delete(variant);
        }
        
        // Then delete the product
        proRepo.delete(product);
    }

    @Transactional
    public List<ProductResponseDTO> getFilteredProducts(Long categoryId, Map<String, List<String>> filters) {
        System.out.println("Received filters: " + filters);
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        categoryIds.addAll(categoryService.getAllDescendantCategoryIds(categoryId));

        List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);

        return products.stream()
                .filter(product -> {
                    // A product is included if at least one of its variants matches ALL selected filters
                    return product.getVariants().stream().anyMatch(variant -> {
                        if (filters == null || filters.isEmpty()) {
                            return true; // No filters, so all variants are considered valid
                        }
                        // Check if this variant matches all selected filters
                        return filters.entrySet().stream().allMatch(filterEntry -> {
                            String attributeName = filterEntry.getKey();
                            Object value = filterEntry.getValue();
                            List<String> attributeValues;
                            
                            // Handle both single string and list of strings
                            if (value instanceof String) {
                                attributeValues = List.of((String) value);
                            } else if (value instanceof List) {
                                attributeValues = (List<String>) value;
                            } else {
                                return false;
                            }

                            // Check if this variant has an attribute matching the name AND one of the values
                            return variant.getAttributeValues().stream()
                                    .anyMatch(vav -> {
                                        String attrName = vav.getAttribute().getName();
                                        String attrValue = vav.getValue();
                                        return attrName.equals(attributeName) && 
                                               attributeValues != null && 
                                               attributeValues.contains(attrValue);
                                    });
                        });
                    });
                })
                .map(this::convertToProductResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Set<String>> getCategoryAttributeOptions(Long categoryId) {
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        categoryIds.addAll(categoryService.getAllDescendantCategoryIds(categoryId));

        Map<String, Set<String>> attributeOptions = new HashMap<>();

        // Get all products within the specified category and its descendants
        List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);

        // Iterate through all products and their variants to collect all distinct attribute values
        for (ProductEntity product : products) {
            for (ProductVariantEntity variant : product.getVariants()) {
                for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                    attributeOptions.computeIfAbsent(vav.getAttribute().getName(), k -> new HashSet<>()).add(vav.getValue());
                }
            }
        }
        return attributeOptions;
    }

    public Integer getLatestPurchasePrice(Long variantId) {
        Optional<PurchaseHistoryEntity> latestPurchase = purchaseHistoryRepository.findTopByVariantIdOrderByPurchaseDateDesc(variantId);
        return latestPurchase.map(PurchaseHistoryEntity::getPurchasePrice).orElse(0);
    }

    @Transactional
    public VariantResponseDTO addStock(Long variantId, AddStockRequestDTO request, Long adminId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // Check if selling price has changed
        boolean priceChanged = variant.getPrice() != request.getSellingPrice();
        Integer oldPrice = variant.getPrice();

        // Create new purchase history record
        PurchaseHistoryEntity purchase = new PurchaseHistoryEntity();
        purchase.setVariant(variant);
        purchase.setPurchasePrice(request.getPurchasePrice());
        purchase.setQuantity(request.getQuantity());
        purchase.setRemainingQuantity(request.getQuantity());
        purchaseHistoryRepository.save(purchase);

        // If selling price changed, create a price history record
        if (priceChanged) {
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(oldPrice); // Store the old price
            priceHistory.setPriceDate(LocalDateTime.now());
            
            // Set the admin who made the change
            if (adminId != null) {
                UserEntity admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            
            priceHistoryRepository.save(priceHistory);
        }

        // Update variant stock and price
        variant.setStock(variant.getStock() + request.getQuantity());
        variant.setPrice(request.getSellingPrice());
        variantRepository.save(variant);

        // Convert to response DTO
        return convertToVariantResponseDTO(variant);
    }

    private VariantResponseDTO convertToVariantResponseDTO(ProductVariantEntity variant) {
        VariantResponseDTO dto = new VariantResponseDTO();
        dto.setId(variant.getId());
        dto.setPrice(variant.getPrice());
        dto.setStock(variant.getStock());
        dto.setSku(variant.getSku());
        dto.setProductName(variant.getProduct().getName());

        // Convert attributes
        Map<String, String> attributes = new HashMap<>();
        for (VariantAttributeValueEntity value : variant.getAttributeValues()) {
            attributes.put(value.getAttribute().getName(), value.getValue());
        }
        dto.setAttributes(attributes);

        // Convert images
        List<String> imageUrls = variant.getImages().stream()
                .map(ProductVariantImage::getImageUrl)
                .collect(Collectors.toList());
        dto.setImageUrls(imageUrls);

        return dto;
    }

    @Transactional
    public List<PriceHistoryResponseDTO> getPriceHistory(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return priceHistoryRepository.findByVariantOrderByPriceDateDesc(variant).stream()
                .map(this::convertToPriceHistoryResponseDTO)
                .toList();
    }

    @Transactional
    public List<PurchaseHistoryResponseDTO> getPurchaseHistory(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant).stream()
                .map(this::convertToPurchaseHistoryResponseDTO)
                .toList();
    }

    private PriceHistoryResponseDTO convertToPriceHistoryResponseDTO(ProductVariantPriceHistoryEntity entity) {
        PriceHistoryResponseDTO dto = new PriceHistoryResponseDTO();
        dto.setId(entity.getId());
        dto.setPrice(entity.getPrice());
        dto.setPriceDate(entity.getPriceDate());
        if (entity.getAdmin() != null) {
            dto.setAdminId(entity.getAdmin().getId());
            dto.setAdminName(entity.getAdmin().getName());
        }
        return dto;
    }

    private PurchaseHistoryResponseDTO convertToPurchaseHistoryResponseDTO(PurchaseHistoryEntity entity) {
        PurchaseHistoryResponseDTO dto = new PurchaseHistoryResponseDTO();
        dto.setId(entity.getId());
        dto.setPurchasePrice(entity.getPurchasePrice());
        dto.setQuantity(entity.getQuantity());
        dto.setRemainingQuantity(entity.getRemainingQuantity());
        dto.setPurchaseDate(entity.getPurchaseDate());
        // Note: PurchaseHistoryEntity doesn't have admin field, so we'll leave admin info null
        return dto;
    }

    public VariantResponseDTO getVariantById(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return convertToVariantResponseDTO(variant);
    }

    public List<ProductResponseDTO> getAllProducts() {
        List<ProductEntity> products = proRepo.findAll();
        return products.stream().map(this::convertToProductResponseDTO).collect(Collectors.toList());
    }
}
