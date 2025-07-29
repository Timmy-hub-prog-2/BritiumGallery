package com.maven.demo.controller;

import com.maven.demo.dto.*;
import com.maven.demo.service.RestockNotificationService;
import com.maven.demo.service.UserDetailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserDetailController {

    private final UserDetailService userDetailService;
    private final RestockNotificationService restockNotificationService;

    public UserDetailController(UserDetailService userDetailService, RestockNotificationService restockNotificationService) {
        this.userDetailService = userDetailService;
        this.restockNotificationService = restockNotificationService;
    }

    @GetMapping("/{id}/personal")
    public ResponseEntity<UserResponseDTO> getPersonalInfo(@PathVariable Long id) {
        return ResponseEntity.ok(userDetailService.getUserPersonalInfo(id));
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<List<OrderResponseDTO>> getOrders(@PathVariable Long id) {
        return ResponseEntity.ok(userDetailService.getUserOrders(id));
    }

    @GetMapping("/{id}/refunds")
    public ResponseEntity<List<RefundRequestDTO.RefundHistoryDTO>> getRefunds(@PathVariable Long id) {
        return ResponseEntity.ok(userDetailService.getUserRefundRequests(id));
    }


    @GetMapping("/{id}/wishlist")
    public ResponseEntity<List<WishlistDTO>> getWishlist(@PathVariable Long id) {
        return ResponseEntity.ok(userDetailService.getUserWishlist(id));
    }

    @GetMapping("/{userId}/remainders")
    public ResponseEntity<?> getUserRemaindersForAdmin(@PathVariable Long userId) {
        try {
            // Fetch notifications or remainder items for the user
            var notifications = restockNotificationService.getNotificationsForUser(userId);

            // Map to DTOs for frontend (variant info, product info, etc.)
            var result = notifications.stream().map(noti -> {
                var variant = noti.getVariant();
                var product = variant.getProduct();
                java.util.Map<String, Object> dto = new java.util.HashMap<>();

                // Map the necessary fields into DTO
                dto.put("notificationId", noti.getId());
                dto.put("variantId", variant.getId());
                dto.put("sku", variant.getSku());
                dto.put("stock", variant.getStock());
                dto.put("price", variant.getPrice());
                dto.put("imageUrls", variant.getImages() != null
                        ? variant.getImages().stream().map(img -> img.getImageUrl()).toList()
                        : java.util.List.of());

                // Handling variant attributes
                dto.put("attributes", variant.getAttributeValues() != null
                        ? variant.getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                        vav -> vav.getAttribute().getName(),
                        vav -> vav.getValue()))
                        : java.util.Map.of());

                // Product-related information
                dto.put("productId", product != null ? product.getId() : null);
                dto.put("productName", product != null ? product.getName() : null);
                dto.put("productBasePhoto", product != null ? product.getBasePhotoUrl() : null);

                return dto;
            }).toList();

            // Return the list of mapped DTOs as the response
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // Error handling if something goes wrong
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Failed to fetch remainder items for this user"));
        }
    }

}
