package com.maven.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.NotificationEntity;
import com.maven.demo.entity.UserEntity;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByRecipient(UserEntity recipient);
    List<NotificationEntity> findByRecipientId(Long recipientId);
    
    // Method to find notifications by related object ID, type, and created after a specific time
    List<NotificationEntity> findByRelatedObjectIdAndTypeAndCreatedAtAfter(Long relatedObjectId, String type, LocalDateTime createdAt);
    
    // Add more query methods as needed
} 