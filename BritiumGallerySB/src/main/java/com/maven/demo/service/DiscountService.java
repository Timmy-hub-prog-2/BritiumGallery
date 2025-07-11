package com.maven.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.demo.dto.DiscountEventDTO;
import com.maven.demo.dto.DiscountEventResponseDTO;
import com.maven.demo.dto.DiscountRuleDTO;
import com.maven.demo.dto.DiscountRuleResponseDTO;
import com.maven.demo.entity.DiscountEvent;
import com.maven.demo.entity.DiscountEventHistory;
import com.maven.demo.entity.DiscountRule;
import com.maven.demo.entity.DiscountRuleAttributeOption;
import com.maven.demo.repository.DiscountEventRepository;
import com.maven.demo.repository.DiscountEventHistoryRepository;
import com.maven.demo.repository.DiscountRuleAttributeOptionRepository;
import com.maven.demo.repository.DiscountRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DiscountService {

    @Autowired private DiscountEventRepository eventRepo;
    @Autowired private DiscountRuleRepository ruleRepo;
    @Autowired private DiscountRuleAttributeOptionRepository optionRepo;
    @Autowired private DiscountEventHistoryRepository historyRepo;
    @Autowired private ObjectMapper objectMapper;

    // Create new discount event with rules
    @Transactional
    public DiscountEvent createDiscountEvent(DiscountEventDTO dto) {
        // Validate dates
        if (dto.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Start date cannot be in the past");
        }
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("End date cannot be before start date");
        }

        // Validate discount hierarchy - prevent overlapping discounts
        validateDiscountHierarchy(dto);

        // Create event
        DiscountEvent event = new DiscountEvent();
        event.setName(dto.getName());
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());
        event.setActive(dto.isActive());
        event.setAdminId(dto.getAdminId());

        // Create rules and add them to the event
        if (dto.getRules() != null) {
            for (DiscountRuleDTO ruleDto : dto.getRules()) {
                DiscountRule rule = new DiscountRule();
                rule.setEvent(event); // Set the event reference
                rule.setCategoryId(ruleDto.getCategoryId());
                rule.setProductId(ruleDto.getProductId());
                rule.setProductVariantId(ruleDto.getProductVariantId());
                rule.setDiscountPercent(ruleDto.getDiscountPercent());
                rule.setAdminId(dto.getAdminId());
                rule.setBrandId(ruleDto.getBrandId());
                rule.setActive(ruleDto.isActive());

                // Create attribute options if specified
                if (ruleDto.getAttributeOptionIds() != null && !ruleDto.getAttributeOptionIds().isEmpty()) {
                    for (Long optionId : ruleDto.getAttributeOptionIds()) {
                        DiscountRuleAttributeOption option = new DiscountRuleAttributeOption();
                        option.setRule(rule); // Set the rule reference
                        option.setAttributeOptionId(optionId);
                        rule.getAttributeOptions().add(option); // Add to rule's list
                    }
                }

                event.getRules().add(rule); // Add rule to event's list
            }
        }

        // Save the event (this will cascade to rules and attribute options)
        DiscountEvent savedEvent = eventRepo.save(event);

        // Record creation history
        recordHistory(savedEvent.getId(), dto.getAdminId(), "CREATED", null, dto);

        return savedEvent;
    }

    // Validate discount hierarchy to prevent conflicts
    private void validateDiscountHierarchy(DiscountEventDTO dto) {
        if (dto.getRules() == null) return;

        for (DiscountRuleDTO rule : dto.getRules()) {
            List<DiscountEvent> activeEvents = eventRepo.findByActiveTrueAndStartDateBeforeAndEndDateAfter(
                dto.getStartDate(), dto.getEndDate());
            for (DiscountEvent event : activeEvents) {
                List<DiscountRule> existingRules = ruleRepo.findByEventId(event.getId());
                for (DiscountRule existingRule : existingRules) {
                    // CATEGORY LEVEL: block if any product or variant in that category is already discounted
                    if (rule.isCategoryDiscount()) {
                        // Block if any product or variant in this category is already discounted
                        if ((existingRule.getCategoryId() != null && existingRule.getCategoryId().equals(rule.getCategoryId()) &&
                             (existingRule.getProductId() != null || existingRule.getProductVariantId() != null))) {
                            throw new RuntimeException("Cannot create category discount when product or variant discounts exist for the same category");
                        }
                    }
                    // PRODUCT LEVEL: block if the product, any of its variants, or its category is already discounted
                    if (rule.isProductDiscount()) {
                        // Block if category or variant discount exists for this product
                        if ((existingRule.getProductId() != null && existingRule.getProductId().equals(rule.getProductId())) ||
                            (existingRule.getCategoryId() != null && existingRule.getCategoryId().equals(rule.getCategoryId())) ||
                            (existingRule.getProductVariantId() != null && existingRule.getProductId() != null && existingRule.getProductId().equals(rule.getProductId()))) {
                            throw new RuntimeException("Cannot create product discount when category or variant discounts exist for this product");
                        }
                    }
                    // PRODUCT VARIANT LEVEL: block if parent product or its category is already discounted
                    if (rule.isProductVariantDiscount()) {
                        if ((existingRule.getProductVariantId() != null && existingRule.getProductVariantId().equals(rule.getProductVariantId())) ||
                            (existingRule.getProductId() != null && existingRule.getProductId().equals(rule.getProductId())) ||
                            (existingRule.getCategoryId() != null && existingRule.getCategoryId().equals(rule.getCategoryId()))) {
                            throw new RuntimeException("Cannot create variant discount when product or category discounts exist for this variant");
                        }
                    }
                }
            }
        }
    }

    // Get all discount events
    public List<DiscountEventResponseDTO> getAllDiscountEvents() {
        return eventRepo.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // Get discount events by admin ID
    public List<DiscountEventResponseDTO> getDiscountEventsByAdminId(Long adminId) {
        return eventRepo.findByAdminId(adminId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // Get active discount events by admin ID
    public List<DiscountEventResponseDTO> getActiveDiscountEventsByAdminId(Long adminId) {
        return eventRepo.findByAdminIdAndActiveTrue(adminId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // Get discount event by ID
    public Optional<DiscountEventResponseDTO> getDiscountEventById(Long id) {
        return eventRepo.findById(id)
                .map(this::convertToResponseDTO);
    }

    // Update discount event
    @Transactional
    public DiscountEvent updateDiscountEvent(Long id, DiscountEventDTO dto) {
        DiscountEvent event = eventRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount event not found"));

        // Store old values for history
        DiscountEventDTO oldDto = convertToDTO(event);

        // Validate dates
        if (dto.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Start date cannot be in the past");
        }
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("End date cannot be before start date");
        }

        // Validate discount hierarchy
        validateDiscountHierarchy(dto);

        event.setName(dto.getName());
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());
        event.setActive(dto.isActive());

        // Remove all existing rules and add new ones
        event.getRules().clear();
        if (dto.getRules() != null) {
            for (DiscountRuleDTO ruleDto : dto.getRules()) {
                DiscountRule rule = new DiscountRule();
                rule.setEvent(event);
                rule.setCategoryId(ruleDto.getCategoryId());
                rule.setProductId(ruleDto.getProductId());
                rule.setProductVariantId(ruleDto.getProductVariantId());
                rule.setDiscountPercent(ruleDto.getDiscountPercent());
                rule.setAdminId(dto.getAdminId());
                rule.setBrandId(ruleDto.getBrandId());
                rule.setActive(ruleDto.isActive());
                // Attribute options
                if (ruleDto.getAttributeOptionIds() != null && !ruleDto.getAttributeOptionIds().isEmpty()) {
                    for (Long optionId : ruleDto.getAttributeOptionIds()) {
                        DiscountRuleAttributeOption option = new DiscountRuleAttributeOption();
                        option.setRule(rule);
                        option.setAttributeOptionId(optionId);
                        rule.getAttributeOptions().add(option);
                    }
                }
                event.getRules().add(rule);
            }
        }

        // Force update to trigger @PreUpdate
        event.setUpdatedAt(java.time.LocalDateTime.now());

        DiscountEvent updatedEvent = eventRepo.save(event);

        // Record update history
        recordHistory(id, dto.getAdminId(), "UPDATED", oldDto, dto);

        return updatedEvent;
    }

    // Delete discount event
    @Transactional
    public void deleteDiscountEvent(Long eventId) {
        DiscountEvent event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Discount event not found"));
        
        // Record deletion history before deleting
        DiscountEventDTO eventDto = convertToDTO(event);
        recordHistory(eventId, event.getAdminId(), "DELETED", eventDto, null);
        
        // Delete history records for this event (not cascaded)
        historyRepo.deleteByEventId(eventId);
        
        // Delete the event (this will cascade to rules and attribute options)
        eventRepo.deleteById(eventId);
    }

    // Get discount information for admin management
    public Map<String, Object> getDiscountInfo(Long categoryId, Long productVariantId) {
        LocalDate today = LocalDate.now();
        List<DiscountEvent> activeEvents = eventRepo.findByActiveTrueAndStartDateBeforeAndEndDateAfter(today, today);
        
        Map<String, Object> result = new HashMap<>();
        result.put("hasCategoryDiscount", false);
        result.put("hasProductDiscount", false);
        result.put("categoryDiscount", null);
        result.put("productDiscount", null);
        result.put("appliedDiscount", null);
        result.put("discountType", null);

        for (DiscountEvent event : activeEvents) {
            List<DiscountRule> rules = ruleRepo.findByEventId(event.getId());
            for (DiscountRule rule : rules) {
                // Check category discount
                if (rule.getCategoryId() != null && rule.getCategoryId().equals(categoryId)) {
                    result.put("hasCategoryDiscount", true);
                    result.put("categoryDiscount", rule.getDiscountPercent());
                    result.put("appliedDiscount", rule.getDiscountPercent());
                    result.put("discountType", "Category");
                    result.put("eventName", event.getName());
                    return result; // Category discount takes priority
                }
            }
        }

        // Check product discount only if no category discount
        for (DiscountEvent event : activeEvents) {
            List<DiscountRule> rules = ruleRepo.findByEventId(event.getId());
            for (DiscountRule rule : rules) {
                if (rule.getProductVariantId() != null && rule.getProductVariantId().equals(productVariantId)) {
                    result.put("hasProductDiscount", true);
                    result.put("productDiscount", rule.getDiscountPercent());
                    result.put("appliedDiscount", rule.getDiscountPercent());
                    result.put("discountType", "Product");
                    result.put("eventName", event.getName());
                    return result;
                }
            }
        }

        return result;
    }

    // Real-world discount logic with hierarchy prevention
    public Optional<Double> getBestDiscount(Long categoryId, Long productVariantId, List<Long> variantAttributeOptionIds) {
        LocalDate today = LocalDate.now();
        List<DiscountEvent> activeEvents = eventRepo.findByActiveTrueAndStartDateBeforeAndEndDateAfter(today, today);

        // Check for category-level discount first (prevents product-specific discounts)
        Double categoryDiscount = null;
        Double productDiscount = null;

        for (DiscountEvent event : activeEvents) {
            List<DiscountRule> rules = ruleRepo.findByEventId(event.getId());
            for (DiscountRule rule : rules) {
                // Category-level discount (highest priority, prevents product discounts)
                if (rule.getCategoryId() != null && rule.getCategoryId().equals(categoryId)) {
                    categoryDiscount = rule.getDiscountPercent();
                    break; // Category discount found, ignore product-specific discounts
                }
            }
        }

        // Only check product-specific discounts if NO category discount exists
        if (categoryDiscount == null) {
            for (DiscountEvent event : activeEvents) {
                List<DiscountRule> rules = ruleRepo.findByEventId(event.getId());
                for (DiscountRule rule : rules) {
                    // Product-specific discount (only if no category discount)
                    if (rule.getProductVariantId() != null && rule.getProductVariantId().equals(productVariantId)) {
                        productDiscount = rule.getDiscountPercent();
                        break;
                    }
                }
            }
        }

        // Return category discount first (prevents product discounts)
        if (categoryDiscount != null) {
            return Optional.of(categoryDiscount);
        } else if (productDiscount != null) {
            return Optional.of(productDiscount);
        }
        
        return Optional.empty();
    }

    // Record history for discount events
    private void recordHistory(Long eventId, Long adminId, String action, DiscountEventDTO oldDto, DiscountEventDTO newDto) {
        try {
            DiscountEventHistory history = new DiscountEventHistory();
            history.setEventId(eventId);
            history.setAdminId(adminId);
            history.setAction(action);
            // Helper to clean up DTO for history
            java.util.function.Function<DiscountEventDTO, Map<String, Object>> cleanDto = dto -> {
                if (dto == null) return null;
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("name", dto.getName());
                map.put("startDate", dto.getStartDate());
                map.put("endDate", dto.getEndDate());
                if (dto.getRules() != null) {
                    map.put("rules", dto.getRules().stream().map(rule -> {
                        java.util.Map<String, Object> r = new java.util.HashMap<>();
                        r.put("type",
                            rule.getCategoryId() != null ? "Category" :
                            rule.getProductId() != null ? "Product" :
                            rule.getBrandId() != null ? "Brand" : "Product Variant");
                        r.put("categoryId", rule.getCategoryId());
                        r.put("productId", rule.getProductId());
                        r.put("productVariantId", rule.getProductVariantId());
                        r.put("brandId", rule.getBrandId());
                        r.put("discountPercent", rule.getDiscountPercent());
                        return r;
                    }).toList());
                }
                return map;
            };
            if (oldDto != null) {
                history.setOldValues(objectMapper.writeValueAsString(cleanDto.apply(oldDto)));
            }
            if (newDto != null) {
                history.setNewValues(objectMapper.writeValueAsString(cleanDto.apply(newDto)));
            }
            historyRepo.save(history);
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to record history: " + e.getMessage());
        }
    }

    // Convert entity to DTO for history tracking
    private DiscountEventDTO convertToDTO(DiscountEvent event) {
        DiscountEventDTO dto = new DiscountEventDTO();
        dto.setName(event.getName());
        dto.setStartDate(event.getStartDate());
        dto.setEndDate(event.getEndDate());
        dto.setActive(event.isActive());
        dto.setAdminId(event.getAdminId());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        // FIX: Include rules for history tracking
        List<DiscountRule> rules = ruleRepo.findByEventId(event.getId());
        dto.setRules(rules.stream()
                .map(this::convertRuleToDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    // Get discount event history
    public List<DiscountEventHistory> getDiscountEventHistory(Long eventId) {
        return historyRepo.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    // Get admin's discount event history
    public List<DiscountEventHistory> getAdminDiscountHistory(Long adminId) {
        return historyRepo.findByAdminIdOrderByCreatedAtDesc(adminId);
    }

    // Get discount event history by action
    public List<DiscountEventHistory> getDiscountEventHistoryByAction(Long eventId, String action) {
        return historyRepo.findByEventIdAndActionOrderByCreatedAtDesc(eventId, action);
    }

    // Convert entity to response DTO
    private DiscountEventResponseDTO convertToResponseDTO(DiscountEvent event) {
        DiscountEventResponseDTO dto = new DiscountEventResponseDTO();
        dto.setId(event.getId());
        dto.setName(event.getName());
        dto.setStartDate(event.getStartDate());
        dto.setEndDate(event.getEndDate());
        dto.setActive(event.isActive());
        dto.setAdminId(event.getAdminId());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        
        // Convert rules
        List<DiscountRule> rules = ruleRepo.findByEventId(event.getId());
        dto.setRules(rules.stream()
                .map(this::convertRuleToResponseDTO)
                .collect(Collectors.toList()));
        
        return dto;
    }

    // Convert rule entity to response DTO
    private DiscountRuleResponseDTO convertRuleToResponseDTO(DiscountRule rule) {
        DiscountRuleResponseDTO dto = new DiscountRuleResponseDTO();
        dto.setId(rule.getId());
        dto.setCategoryId(rule.getCategoryId());
        dto.setProductId(rule.getProductId());
        dto.setProductVariantId(rule.getProductVariantId());
        dto.setDiscountPercent(rule.getDiscountPercent());
        dto.setAdminId(rule.getAdminId());
        dto.setBrandId(rule.getBrandId());
        dto.setActive(rule.isActive());
        dto.setCreatedAt(rule.getCreatedAt());
        dto.setUpdatedAt(rule.getUpdatedAt());
        
        // Get attribute option IDs
        List<DiscountRuleAttributeOption> options = optionRepo.findByRuleId(rule.getId());
        dto.setAttributeOptionIds(options.stream()
                .map(DiscountRuleAttributeOption::getAttributeOptionId)
                .collect(Collectors.toList()));
        
        return dto;
    }

    // Activate discount event
    @Transactional
    public DiscountEvent activateDiscountEvent(Long id) {
        DiscountEvent event = eventRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount event not found"));
        event.setActive(true);
        return eventRepo.save(event);
    }

    // Deactivate discount event
    @Transactional
    public DiscountEvent deactivateDiscountEvent(Long id) {
        DiscountEvent event = eventRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount event not found"));
        event.setActive(false);
        return eventRepo.save(event);
    }

    private DiscountRuleDTO convertRuleToDTO(DiscountRule rule) {
        DiscountRuleDTO dto = new DiscountRuleDTO();
        dto.setCategoryId(rule.getCategoryId());
        dto.setProductId(rule.getProductId());
        dto.setProductVariantId(rule.getProductVariantId());
        dto.setDiscountPercent(rule.getDiscountPercent());
        dto.setAdminId(rule.getAdminId());
        dto.setBrandId(rule.getBrandId());
        dto.setActive(rule.isActive());
        // Add attribute options if needed
        return dto;
    }
}

