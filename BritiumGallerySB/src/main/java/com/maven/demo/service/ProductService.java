package com.maven.demo.service;

import com.maven.demo.dto.*;
import com.maven.demo.entity.*;
import com.maven.demo.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

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

        proRepo.save(product);

        // Handle Variants
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

            // Save variant first to get the ID
            variantRepository.save(variant);

            // Save image if provided
            if (varDto.getPhotoUrl() != null && !varDto.getPhotoUrl().isBlank()) {
                ProductVariantImage image = new ProductVariantImage();
                image.setVariant(variant);
                image.setImageUrl(varDto.getPhotoUrl());
                image.setCreatedAt(LocalDateTime.now());
                variant.getImages().add(image);
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



    public List<ProductResponseDTO>getProductsByCategory(Long categoryId) {
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

    public List<String> getProductBreadcrumb(Long productId) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

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

//        @Transactional
//        public void saveProductWithVariantsAndOptions(ProductRequestDTO dto) {
//            // Save product
//
//            catRepo.getById()
//            ProductEntity product = new ProductEntity();
//            product.setName(dto.getName());
//            product.setDescription(dto.getDescription());
//            product.setBasePhotoUrl(dto.getBasePhotoUrl());
//
//            product.setCategoryId(dto.getCategoryId());
//            product.setAdminId(dto.getAdminId());
//            product = proRepo.save(product);
//
//            // Save attribute options
//            if (dto.getAttributeOptions() != null) {
//                for (AttributeOptionDTO optionDTO : dto.getAttributeOptions()) {
//                    Attribute attribute = attriRepo.findById(optionDTO.getAttributeId())
//                            .orElseThrow(() -> new RuntimeException("Attribute not found"));
//
//                    // Delete existing options for this attribute
//                    attributeOptionRepository.deleteByAttributeId(attribute.getId());
//
//                    // Save new options
//                    for (String optionValue : optionDTO.getOptions()) {
//                        AttributeOption option = new AttributeOption();
//                        option.setAttribute(attribute);
//                        option.setValue(optionValue);
//                        attributeOptionRepository.save(option);
//                    }
//                }
//            }
//
//            // Save variants
//            for (VariantDTO variantDTO : dto.getVariants()) {
//                Variant variant = new Variant();
//                variant.setProduct(product);
//                variant.setPrice(variantDTO.getPrice());
//                variant.setStock(variantDTO.getStock());
//                variant.setPhotoUrl(variantDTO.getPhotoUrl());
//
//                // Convert attributes map to JSON string
//                String attributesJson = convertAttributesToJson(variantDTO.getAttributes());
//                variant.setAttributes(attributesJson);
//
//                variantRepo.save(variant);
//            }
//        }


//        public List<ProductResponseDTO> getProductsByParentCategory(Long parentId) {
//            // Step 1: Fetch all child category IDs under this parent
//            List<CategoryEntity> subCategories = catRepo.findByParentId(parentId);
//            List<Long> categoryIds = subCategories.stream()
//                    .map(CategoryEntity::getId)
//                    .toList();
//
//            // Also include the parent category itself
//            categoryIds.add(parentId);
//
//            // Step 2: Fetch all products that belong to the parent and its subcategories
//            List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);
//
//            // Step 3: Map to response DTOs
//            return products.stream().map(product -> {
//                ProductResponseDTO dto = new ProductResponseDTO();
//                dto.setId(product.getId());
//                dto.setName(product.getName());
//                dto.setDescription(product.getDescription());
//                dto.setRating(product.getRating());
//                dto.setCategoryId(product.getCategory().getId());
//                dto.setAdminId(product.getAdmin_id());
//
//                // Step 4: Get variants linked to this product
//                List<ProductVariantEntity> variants = product.getVariants(); // JPA fetches variants
//
//                List<VariantResponseDTO> variantDTOs = variants.stream().map(variant -> {
//                    VariantResponseDTO varDTO = new VariantResponseDTO();
//                    varDTO.setId(variant.getId());
//                    varDTO.setPrice(variant.getPrice());
//                    varDTO.setStock(variant.getStock());
//
//                    Map<String, String> attrMap = new HashMap<>();
//                    for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
//                        attrMap.put(vav.getAttribute().getName(), vav.getValue());
//                    }
//
//                    varDTO.setAttributes(attrMap);
//                    return varDTO;
//                }).toList();
//
//                dto.setVariants(variantDTOs);
//                return dto;
//            }).toList();
//        }







}
