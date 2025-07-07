package com.maven.demo.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ScheduledNotificationDTO {
    public Long id;
    public String title;
    public String message;
    public String type;
    public java.time.LocalDateTime createdAt;
    public java.time.LocalDateTime startDate;
    public java.time.LocalDateTime endDate;
    public String cronExpression;
    public boolean active;
    public List<Long> roleIds;
    public List<Long> customerTypeIds;
    public ScheduledNotificationDTO(Long id, String title, String message, String type, java.time.LocalDateTime createdAt, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, boolean active, List<Long> roleIds, List<Long> customerTypeIds, String cronExpression) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.createdAt = createdAt;
        this.startDate = startDate;
        this.endDate = endDate;
        this.active = active;
        this.roleIds = roleIds;
        this.customerTypeIds = customerTypeIds;
        this.cronExpression = cronExpression;
    }
}
