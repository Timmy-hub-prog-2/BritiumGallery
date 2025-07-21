package com.maven.demo.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.AttributeDTO;
import com.maven.demo.dto.CategoryDTO;
import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.CategoryEntity;
import com.maven.demo.entity.DiscountRule;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.repository.AttributeOptionRepository;
import com.maven.demo.repository.AttributeRepository;
import com.maven.demo.repository.CategoryRepository;
import com.maven.demo.repository.DiscountRuleAttributeOptionRepository;
import com.maven.demo.repository.DiscountRuleRepository;
import com.maven.demo.repository.ProductRepository;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.repository.VariantAttributeValueRepository;
import com.maven.demo.repository.productVariantImageRepository;

import jakarta.transaction.Transactional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repo;

    @Autowired
    private AttributeRepository attributeRepository;

    @Autowired
    private ModelMapper mapper;

    @Autowired
    private AttributeOptionRepository attributeOptionRepository;

    @Autowired
    private VariantAttributeValueRepository variantAttributeValueRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private productVariantImageRepository productVariantImageRepository;

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    @Autowired
    private DiscountRuleAttributeOptionRepository discountRuleAttributeOptionRepository;

    public CategoryDTO insertCategory(CategoryDTO dto) {
        CategoryEntity entity = new CategoryEntity();
        entity.setName(dto.getName());
        entity.setAdmin_id(0);
        entity.setCreated_at(LocalDateTime.now());
        entity.setImage_url(dto.getImage_url());

        if (dto.getParent_category_id() != null) {
            CategoryEntity parent = repo.findById(dto.getParent_category_id()).orElse(null);
            entity.setParentCategory(parent);
        }

        repo.save(entity);

        if (dto.getAttributes() != null) {
            for (AttributeDTO attrDto : dto.getAttributes()) {
                AttributeEntity attrEntity = new AttributeEntity();
                attrEntity.setName(attrDto.getName());
                attrEntity.setData_type(attrDto.getDataType());
                attrEntity.setCategory(entity);
                attributeRepository.save(attrEntity);
            }
        }

        return dto;
    }

    public List<CategoryDTO> getAllCategories() {
        List<CategoryEntity> cateList = repo.findAll();
        return cateList.stream().map(entity -> {
            CategoryDTO dto = mapper.map(entity, CategoryDTO.class);
            dto.setParent_category_id(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
            return dto;
        }).toList();
    }

    public List<CategoryDTO> getSubCategories(Long id) {
        List<CategoryEntity> cateList = repo.findByParentCategoryId(id);
        return cateList.stream().map(entity -> {
            CategoryDTO dto = mapper.map(entity, CategoryDTO.class);
            dto.setParent_category_id(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
            return dto;
        }).toList();
    }

    // ✅ Update Category with selective updates
    @Transactional
    public CategoryDTO updateCategory(CategoryDTO dto) {
        CategoryEntity entity = repo.findById(dto.getId()).orElse(null);
        if (entity == null) return null;

        // Update basic fields
        entity.setName(dto.getName());
        entity.setCreated_at(LocalDateTime.now());
        
        // Update image URL if provided
        if (dto.getImage_url() != null && !dto.getImage_url().isEmpty()) {
            entity.setImage_url(dto.getImage_url());
        }

        // Update parent category if changed
        if (dto.getParent_category_id() != null) {
            CategoryEntity parent = repo.findById(dto.getParent_category_id()).orElse(null);
            entity.setParentCategory(parent);
        } else {
            entity.setParentCategory(null);
        }

        // Only update attributes if they are provided in the DTO
        if (dto.getAttributes() != null) {
            // Get existing attributes to preserve those that haven't changed
            List<AttributeEntity> existingAttributes = new ArrayList<>(entity.getAttributes());
            List<AttributeEntity> attributesToKeep = new ArrayList<>();
            List<AttributeEntity> attributesToAdd = new ArrayList<>();

            // Process new/updated attributes
            for (AttributeDTO attrDto : dto.getAttributes()) {
                boolean found = false;
                for (AttributeEntity existingAttr : existingAttributes) {
                    if (existingAttr.getName().equals(attrDto.getName())) {
                        // Keep existing attribute if name matches
                        attributesToKeep.add(existingAttr);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // Create new attribute if not found
                    AttributeEntity newAttr = new AttributeEntity();
                    newAttr.setName(attrDto.getName());
                    newAttr.setData_type("STRING");
                    newAttr.setCategory(entity);
                    attributesToAdd.add(newAttr);
                }
            }

            // Remove attributes that are no longer in the DTO
            for (AttributeEntity existingAttr : existingAttributes) {
                if (!attributesToKeep.contains(existingAttr)) {
                    // Delete variant attribute values first
                    variantAttributeValueRepository.deleteByAttributeId(existingAttr.getId());
                    // Delete attribute options
                    attributeOptionRepository.deleteByAttributeId(existingAttr.getId());
                    // Remove from category
                    entity.getAttributes().remove(existingAttr);
                    // Delete the attribute
                    attributeRepository.delete(existingAttr);
                }
            }

            // Add new attributes
            for (AttributeEntity newAttr : attributesToAdd) {
                entity.getAttributes().add(newAttr);
                attributeRepository.save(newAttr);
            }
        }

        // Save the entity
        entity = repo.save(entity);

        // Convert updated entity back to DTO
        CategoryDTO updatedDto = mapper.map(entity, CategoryDTO.class);
        updatedDto.setParent_category_id(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
        
        // Map attributes if they exist
        if (entity.getAttributes() != null) {
            updatedDto.setAttributes(
                entity.getAttributes().stream().map(attr -> {
                    AttributeDTO attrDto = new AttributeDTO();
                    attrDto.setName(attr.getName());
                    attrDto.setDataType("STRING"); // Always return STRING
                    return attrDto;
                }).toList()
            );
        }

        return updatedDto;
    }

    @Transactional
    public void deleteCategory(Long id) {
        // Get all descendant category IDs (including the current one)
        Set<Long> allCategoryIds = new HashSet<>();
        allCategoryIds.add(id);
        allCategoryIds.addAll(getAllDescendantCategoryIds(id));

        // For each category, delete discount rules, products, and variants
        for (Long categoryId : allCategoryIds) {
            // 1. Delete discount rules by categoryId
            List<DiscountRule> categoryRules = discountRuleRepository.findByCategoryId(categoryId);
            for (DiscountRule rule : categoryRules) {
                // Delete attribute options for this rule
                discountRuleAttributeOptionRepository.deleteByRuleId(rule.getId());
                // Delete the rule itself
                discountRuleRepository.delete(rule);
            }

            // 2. Delete discount rules for products in this category
            List<ProductEntity> products = productRepository.findByCategoryId(categoryId);
            for (ProductEntity product : products) {
                List<DiscountRule> productRules = discountRuleRepository.findByProductId(product.getId());
                for (DiscountRule rule : productRules) {
                    discountRuleAttributeOptionRepository.deleteByRuleId(rule.getId());
                    discountRuleRepository.delete(rule);
                }

                // 3. Delete discount rules for variants of this product
                List<ProductVariantEntity> variants = productVariantRepository.findByProductId(product.getId());
                for (ProductVariantEntity variant : variants) {
                    List<DiscountRule> variantRules = discountRuleRepository.findByProductVariantId(variant.getId());
                    for (DiscountRule rule : variantRules) {
                        discountRuleAttributeOptionRepository.deleteByRuleId(rule.getId());
                        discountRuleRepository.delete(rule);
                    }
                }
            }
        }

        // Now delete the category (cascades to products/variants if set up)
        CategoryEntity category = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        repo.delete(category);
    }

    public CategoryDTO getCategoryById(Long id) {
        CategoryEntity entity = repo.findById(id).orElse(null);
        if (entity == null) return null;

        CategoryDTO dto = mapper.map(entity, CategoryDTO.class);
        dto.setParent_category_id(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
        // Manually map attributes since ModelMapper may skip them depending on config
        dto.setAttributes(
                entity.getAttributes().stream().map(attr -> {
                    AttributeDTO attrDto = new AttributeDTO();
                    attrDto.setName(attr.getName());
                    attrDto.setDataType(attr.getData_type());
                    return attrDto;
                }).toList()
        );
        return dto;
    }

    public Set<Long> getAllDescendantCategoryIds(Long categoryId) {
        Set<Long> descendantIds = new HashSet<>();
        List<CategoryEntity> directChildren = repo.findByParentCategoryId(categoryId);
        for (CategoryEntity child : directChildren) {
            descendantIds.add(child.getId());
            descendantIds.addAll(getAllDescendantCategoryIds(child.getId())); // Recursive call
        }
        return descendantIds;
    }

    public List<CategoryDTO> getCategoryPath(Long categoryId) {
        List<CategoryDTO> path = new ArrayList<>();
        CategoryEntity category = repo.findById(categoryId).orElse(null);
        
        if (category == null) {
            return path;
        }

        // Build path from current category up to root
        while (category != null) {
            CategoryDTO dto = mapper.map(category, CategoryDTO.class);
            if (category.getParentCategory() != null) {
                dto.setParent_category_id(category.getParentCategory().getId());
            }
            path.add(dto);
            category = category.getParentCategory();
        }

        // Reverse the list to get root-to-leaf order
        Collections.reverse(path);
        return path;
    }
}
