package com.maven.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
} 