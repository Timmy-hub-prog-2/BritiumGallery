package com.maven.demo.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.AttributeOptionDTO;
import com.maven.demo.dto.ProductRequestDTO;
import com.maven.demo.dto.ProductResponseDTO;
import com.maven.demo.dto.VariantDTO;
import com.maven.demo.dto.VariantResponseDTO;
import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.AttributeOptions;
import com.maven.demo.entity.CategoryEntity;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.ProductVariantImage;
import com.maven.demo.entity.VariantAttributeValueEntity;
import com.maven.demo.repository.AttributeOptionRepository;
import com.maven.demo.repository.AttributeRepository;
import com.maven.demo.repository.CategoryRepository;
import com.maven.demo.repository.ProductRepository;
import com.maven.demo.repository.ProductVariantRepository;

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
            if (varDto.getImageUrls() != null && !varDto.getImageUrls().isEmpty()) {
                ProductVariantImage image = new ProductVariantImage();
                image.setVariant(variant);
                image.setImageUrl(varDto.getImageUrls().get(0)); // Use the first photo URL for now
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

        proRepo.save(product);

        // Convert to response DTO
        return convertToProductResponseDTO(product);
    }

    @Transactional
    public ProductResponseDTO updateVariant(Long variantId, VariantDTO dto, List<String> newPhotoUrls) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // Update basic variant details
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());

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

        // Note: Existing images that are not in imageUrlsToDelete will automatically be retained
        // due to the persistent collection management by JPA/Hibernate.

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
}
