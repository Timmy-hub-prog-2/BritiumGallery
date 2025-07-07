package com.maven.demo.controller;

import com.maven.demo.dto.DiscountEventDTO;
import com.maven.demo.dto.DiscountEventResponseDTO;
import com.maven.demo.entity.DiscountEvent;
import com.maven.demo.entity.DiscountEventHistory;
import com.maven.demo.service.DiscountService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/discount")
@CrossOrigin(origins = "http://localhost:4200")
public class DiscountController {
    @Autowired private DiscountService discountService;

    // Create new discount event
    @PostMapping("/events")
    public ResponseEntity<DiscountEvent> createDiscountEvent(@RequestBody DiscountEventDTO dto) {
        DiscountEvent event = discountService.createDiscountEvent(dto);
        return ResponseEntity.ok(event);
    }

    // Get all discount events
    @GetMapping("/events")
    public ResponseEntity<List<DiscountEventResponseDTO>> getAllDiscountEvents() {
        List<DiscountEventResponseDTO> events = discountService.getAllDiscountEvents();
        return ResponseEntity.ok(events);
    }

    // Get discount events by admin ID
    @GetMapping("/events/admin/{adminId}")
    public ResponseEntity<List<DiscountEventResponseDTO>> getDiscountEventsByAdminId(@PathVariable Long adminId) {
        List<DiscountEventResponseDTO> events = discountService.getDiscountEventsByAdminId(adminId);
        return ResponseEntity.ok(events);
    }

    // Get active discount events by admin ID
    @GetMapping("/events/admin/{adminId}/active")
    public ResponseEntity<List<DiscountEventResponseDTO>> getActiveDiscountEventsByAdminId(@PathVariable Long adminId) {
        List<DiscountEventResponseDTO> events = discountService.getActiveDiscountEventsByAdminId(adminId);
        return ResponseEntity.ok(events);
    }

    // Get discount event by ID
    @GetMapping("/events/{id}")
    public ResponseEntity<DiscountEventResponseDTO> getDiscountEventById(@PathVariable Long id) {
        Optional<DiscountEventResponseDTO> event = discountService.getDiscountEventById(id);
        return event.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update discount event
    @PutMapping("/events/{id}")
    public ResponseEntity<DiscountEvent> updateDiscountEvent(@PathVariable Long id, @RequestBody DiscountEventDTO dto) {
        DiscountEvent event = discountService.updateDiscountEvent(id, dto);
        return ResponseEntity.ok(event);
    }

    // Delete discount event
    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteDiscountEvent(@PathVariable Long id) {
        discountService.deleteDiscountEvent(id);
        return ResponseEntity.ok().build();
    }

    // Activate discount event
    @PutMapping("/events/{id}/activate")
    public ResponseEntity<DiscountEvent> activateDiscountEvent(@PathVariable Long id) {
        DiscountEvent event = discountService.activateDiscountEvent(id);
        return ResponseEntity.ok(event);
    }

    // Deactivate discount event
    @PutMapping("/events/{id}/deactivate")
    public ResponseEntity<DiscountEvent> deactivateDiscountEvent(@PathVariable Long id) {
        DiscountEvent event = discountService.deactivateDiscountEvent(id);
        return ResponseEntity.ok(event);
    }

    // Get discount event history
    @GetMapping("/events/{id}/history")
    public ResponseEntity<List<DiscountEventHistory>> getDiscountEventHistory(@PathVariable Long id) {
        List<DiscountEventHistory> history = discountService.getDiscountEventHistory(id);
        return ResponseEntity.ok(history);
    }

    // Get admin's discount history
    @GetMapping("/history/admin/{adminId}")
    public ResponseEntity<List<DiscountEventHistory>> getAdminDiscountHistory(@PathVariable Long adminId) {
        List<DiscountEventHistory> history = discountService.getAdminDiscountHistory(adminId);
        return ResponseEntity.ok(history);
    }

    // Get discount event history by action
    @GetMapping("/events/{id}/history/{action}")
    public ResponseEntity<List<DiscountEventHistory>> getDiscountEventHistoryByAction(
            @PathVariable Long id, @PathVariable String action) {
        List<DiscountEventHistory> history = discountService.getDiscountEventHistoryByAction(id, action);
        return ResponseEntity.ok(history);
    }

    // Get discount information for admin management
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getDiscountInfo(
            @RequestParam Long categoryId,
            @RequestParam Long productVariantId
    ) {
        Map<String, Object> discountInfo = discountService.getDiscountInfo(categoryId, productVariantId);
        return ResponseEntity.ok(discountInfo);
    }

    // Get best discount for a product
    @GetMapping("/best")
    public ResponseEntity<Double> getBestDiscount(
            @RequestParam Long categoryId,
            @RequestParam Long productVariantId,
            @RequestParam List<Long> attributeOptionIds
    ) {
        Optional<Double> discount = discountService.getBestDiscount(categoryId, productVariantId, attributeOptionIds);
        return ResponseEntity.ok(discount.orElse(0.0));
    }
}
