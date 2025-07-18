package com.maven.demo.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.RestockNotificationEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.repository.RestockNotificationRepository;
import com.maven.demo.repository.UserRepository;

@Service
public class RestockNotificationService {
    @Autowired
    private RestockNotificationRepository restockNotificationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductVariantRepository productVariantRepository;

    public RestockNotificationEntity registerNotification(Long userId, Long productVariantId) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        Optional<ProductVariantEntity> variantOpt = productVariantRepository.findById(productVariantId);
        if (userOpt.isEmpty() || variantOpt.isEmpty()) {
            throw new IllegalArgumentException("User or Product Variant not found");
        }
        UserEntity user = userOpt.get();
        ProductVariantEntity variant = variantOpt.get();

        // Check for existing notification
        if (restockNotificationRepository.existsByUserAndVariant(user, variant)) {
            throw new IllegalArgumentException("You have already registered for this restock notification.");
        }

        RestockNotificationEntity entity = new RestockNotificationEntity();
        entity.setUser(user);
        entity.setVariant(variant);
        entity.setCreatedAt(LocalDateTime.now());
        return restockNotificationRepository.save(entity);
    }
} 