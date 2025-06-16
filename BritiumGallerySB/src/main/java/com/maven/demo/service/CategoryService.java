package com.maven.demo.service;

import com.maven.demo.dto.AttributeDTO;
import com.maven.demo.dto.CategoryDTO;
import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.CategoryEntity;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.repository.*;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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
        List<CategoryEntity> cateList = repo.findByParentCategoryIsNull();
        return cateList.stream().map(c -> mapper.map(c, CategoryDTO.class)).toList();
    }

    public List<CategoryDTO> getSubCategories(Long id) {
        List<CategoryEntity> cateList = repo.findByParentCategoryId(id);
        return cateList.stream().map(c -> mapper.map(c, CategoryDTO.class)).toList();
    }

    // ✅ Update Category
    public void updateCategory(CategoryDTO dto) {
        CategoryEntity entity = repo.findById(dto.getId()).orElse(null);
        if (entity == null) return;

        entity.setName(dto.getName());
        entity.setCreated_at(LocalDateTime.now());

        if (dto.getParent_category_id() != null) {
            CategoryEntity parent = repo.findById(dto.getParent_category_id()).orElse(null);
            entity.setParentCategory(parent);
        } else {
            entity.setParentCategory(null);
        }

        repo.save(entity);

        // ✅ Update attributes: remove old ones and insert new ones
        attributeRepository.deleteByCategoryId(entity.getId());

        if (dto.getAttributes() != null) {
            for (AttributeDTO attrDto : dto.getAttributes()) {
                AttributeEntity attrEntity = new AttributeEntity();
                attrEntity.setName(attrDto.getName());
                attrEntity.setData_type(attrDto.getDataType());
                attrEntity.setCategory(entity);
                attributeRepository.save(attrEntity);
            }
        }
    }

    @Transactional
    public void deleteCategory(Long id) {
        CategoryEntity category = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        repo.delete(category);
    }



    public CategoryDTO getCategoryById(Long id) {
        CategoryEntity entity = repo.findById(id).orElse(null);
        if (entity == null) return null;

        CategoryDTO dto = mapper.map(entity, CategoryDTO.class);

        // Manually map attributes since ModelMapper may skip them depending on config
        dto.setAttributes(
                entity.getAttributes().stream().map(attr -> {
                    AttributeDTO attrDto = new AttributeDTO();
                    attrDto.setName(attr.getName());
                    attrDto.setDataType(attr.getData_type());
                    return attrDto;
                }).toList()
        );

        if (entity.getParentCategory() != null) {
            dto.setParent_category_id(entity.getParentCategory().getId());
        }

        return dto;
    }



}
