package com.maven.demo.service;

import com.maven.demo.dto.PrivacyPolicyDTO;
import com.maven.demo.entity.PrivacyPolicyEntity;
import com.maven.demo.repository.PrivacyPolicyRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PrivacyPolicyService {

    @Autowired
    private PrivacyPolicyRepository repository;

    @Autowired
    private ModelMapper mapper;

    public PrivacyPolicyDTO getLatestPolicy() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"))
                .stream()
                .findFirst()
                .map(this::convertToDto)
                .orElse(null);
    }

    public PrivacyPolicyDTO createPolicy(PrivacyPolicyDTO dto) {
        PrivacyPolicyEntity entity = new PrivacyPolicyEntity();
        entity.setContent(dto.getContent());
        entity.setActive(dto.isActive());
        entity.setUpdatedAt(LocalDateTime.now());

        PrivacyPolicyEntity saved = repository.save(entity);
        return mapper.map(saved, PrivacyPolicyDTO.class);
    }

    public PrivacyPolicyDTO updatePolicy(Long id, PrivacyPolicyDTO dto) {
        PrivacyPolicyEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found with id: " + id));

        entity.setContent(dto.getContent());
        entity.setActive(dto.isActive());
        entity.setUpdatedAt(LocalDateTime.now());

        PrivacyPolicyEntity updated = repository.save(entity);
        return mapper.map(updated, PrivacyPolicyDTO.class);
    }

    public void deletePolicy(Long id) {
        repository.deleteById(id);
    }

    public List<PrivacyPolicyDTO> getAllPolicies() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"))
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }


    private PrivacyPolicyDTO convertToDto(PrivacyPolicyEntity entity) {
        PrivacyPolicyDTO dto = new PrivacyPolicyDTO();
        dto.setId(entity.getId());
        dto.setContent(entity.getContent());
        dto.setActive(entity.isActive());
        return dto;
    }
}
