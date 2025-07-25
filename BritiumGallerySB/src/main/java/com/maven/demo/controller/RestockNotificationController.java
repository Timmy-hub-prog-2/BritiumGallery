package com.maven.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.maven.demo.entity.RestockNotificationEntity;
import com.maven.demo.service.RestockNotificationService;

@RestController
@RequestMapping("/restock-notification")
@CrossOrigin(origins = "http://localhost:4200")
public class RestockNotificationController {
    @Autowired
    private RestockNotificationService restockNotificationService;

    @PostMapping("/register")
    public ResponseEntity<?> registerNotification(@RequestParam Long userId, @RequestParam Long productVariantId) {
        try {
            RestockNotificationEntity entity = restockNotificationService.registerNotification(userId, productVariantId);
            return ResponseEntity.ok().body(java.util.Map.of("message", "Registered for restock notification."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("message", "Failed to register notification."));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserRestockNotifications(@RequestParam Long userId) {
        var notifications = restockNotificationService.getNotificationsForUser(userId);
        // Map to DTOs for frontend (variant info, product info, etc.)
        var result = notifications.stream().map(noti -> {
            var variant = noti.getVariant();
            var product = variant.getProduct();
            java.util.Map<String, Object> dto = new java.util.HashMap<>();
            dto.put("notificationId", noti.getId());
            dto.put("variantId", variant.getId());
            dto.put("sku", variant.getSku());
            dto.put("stock", variant.getStock());
            dto.put("price", variant.getPrice());
            dto.put("imageUrls", variant.getImages() != null ? variant.getImages().stream().map(img -> img.getImageUrl()).toList() : java.util.List.of());
            dto.put("attributes", variant.getAttributeValues() != null ? variant.getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                vav -> vav.getAttribute().getName(),
                vav -> vav.getValue()
            )) : java.util.Map.of());
            dto.put("productId", product != null ? product.getId() : null);
            dto.put("productName", product != null ? product.getName() : null);
            dto.put("productBasePhoto", product != null ? product.getBasePhotoUrl() : null);
            return dto;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteRestockNotification(@PathVariable Long notificationId) {
        try {
            restockNotificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(java.util.Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("success", false, "error", e.getMessage()));
        }
    }
} 