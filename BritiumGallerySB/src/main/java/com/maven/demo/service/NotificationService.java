package com.maven.demo.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.NotificationDTO;
import com.maven.demo.entity.NotificationEntity;
import com.maven.demo.entity.NotificationSource;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.NotificationRepository;
import com.maven.demo.repository.OrderRepository;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    public SimpMessagingTemplate messagingTemplate;

    @Autowired
    private OrderRepository orderRepository;

    public NotificationEntity createUserNotification(UserEntity recipient, String title, String message, String type, Long relatedObjectId) {
        NotificationEntity notification = new NotificationEntity();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedObjectId(relatedObjectId);
        notification.setSource(NotificationSource.SYSTEM);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        NotificationEntity savedNotification = notificationRepository.save(notification);
        // Send via WebSocket
        NotificationDTO dto = NotificationDTO.fromEntity(savedNotification);
        // Set trackingCode if ORDER
        if ("ORDER".equals(type) && relatedObjectId != null) {
            OrderEntity order = orderRepository.findById(relatedObjectId).orElse(null);
            if (order != null) {
                dto.trackingCode = order.getTrackingCode();
            }
        }
        messagingTemplate.convertAndSend("/topic/notifications.user." + recipient.getId(), dto);
        return savedNotification;
    }
} 