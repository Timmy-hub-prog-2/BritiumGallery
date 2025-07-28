package com.maven.demo.service;

import com.maven.demo.dto.VariantEditHistoryDTO;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.VariantEditHistory;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.repository.VariantEditHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VariantEditHistoryService {
    @Autowired
    private VariantEditHistoryRepository variantEditHistoryRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void recordVariantEditHistory(Long variantId, Long adminId, String action, String fieldName, String oldValue, String newValue) {
        VariantEditHistory history = new VariantEditHistory();
        history.setVariantId(variantId);
        history.setAdminId(adminId);
        history.setAction(action);
        history.setFieldName(fieldName);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        variantEditHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<VariantEditHistoryDTO> getVariantEditHistoryByVariantId(Long variantId) {
        List<VariantEditHistory> histories = variantEditHistoryRepository.findByVariantIdOrderByCreatedAtDesc(variantId);
        return histories.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private VariantEditHistoryDTO convertToDTO(VariantEditHistory history) {
        VariantEditHistoryDTO dto = new VariantEditHistoryDTO();
        dto.setId(history.getId());
        dto.setVariantId(history.getVariantId());
        dto.setAdminId(history.getAdminId());
        dto.setAction(history.getAction());
        dto.setFieldName(history.getFieldName());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setCreatedAt(history.getCreatedAt());
        if (history.getAdminId() != null) {
            UserEntity admin = userRepository.findById(history.getAdminId()).orElse(null);
            dto.setAdminName(admin != null ? admin.getName() : "Unknown Admin");
        }
        return dto;
    }
} 