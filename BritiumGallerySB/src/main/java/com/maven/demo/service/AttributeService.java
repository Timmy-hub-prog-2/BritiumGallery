package com.maven.demo.service;

import com.maven.demo.dto.AttributeDTO;
import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.AttributeOptions;
import com.maven.demo.repository.AttributeRepository;
import com.maven.demo.repository.AttributeOptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttributeService {

    @Autowired
    private AttributeRepository attributeRepository;

    @Autowired
    private AttributeOptionRepository attributeOptionRepository;

    public List<AttributeDTO> getAttributesForCategory(Long categoryId) {
        List<AttributeEntity> attributes = attributeRepository.findByCategoryId(categoryId);
        
        return attributes.stream().map(attr -> {
            AttributeDTO dto = new AttributeDTO();
            dto.setId(attr.getId());
            dto.setName(attr.getName());
            dto.setDataType(attr.getData_type());
            
            // Fetch and set options for this attribute
            List<String> options = attributeOptionRepository.findByAttributeId(attr.getId())
                .stream()
                .map(AttributeOptions::getValue)
                .collect(Collectors.toList());
            dto.setOptions(options);
            
            return dto;
        }).collect(Collectors.toList());
    }
}
