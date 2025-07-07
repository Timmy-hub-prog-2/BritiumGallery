package com.maven.demo.dto;

import java.time.LocalDateTime;

import com.maven.demo.entity.NotificationEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationDTO {
    public Long id;
    public String title;
    public String message;
    public String type;
    public boolean isRead;
    public LocalDateTime createdAt;
    public Long relatedObjectId;
    public String trackingCode;
    public String actionLink;

    public static NotificationDTO fromEntity(NotificationEntity entity) {
        NotificationDTO dto = new NotificationDTO();
        dto.id = entity.getId();
        dto.title = entity.getTitle();
        dto.message = entity.getMessage();
        dto.type = entity.getType();
        dto.isRead = entity.isRead();
        dto.createdAt = entity.getCreatedAt();
        dto.relatedObjectId = entity.getRelatedObjectId();
        dto.actionLink = entity.getActionLink();
        if (entity.getRelatedObjectId() != null && entity.getType() != null && entity.getType().equals("ORDER")) {
            // You may need to fetch the order entity here if not already available
            // For now, leave as null; will set in notification creation
        }
        return dto;
    }
} 