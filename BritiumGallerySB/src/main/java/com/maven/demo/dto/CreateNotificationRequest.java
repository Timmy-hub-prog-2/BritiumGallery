package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateNotificationRequest {
    public String mode; // INSTANT or SCHEDULED
    public String title;
    public String message;
    public String type;
    public java.util.List<Long> roleIds;
    public java.util.List<Long> customerTypeIds; // optional
    public String actionLink; // optional
    public String cronExpression; // for SCHEDULED
    public LocalDateTime startDate; // for SCHEDULED
    public LocalDateTime endDate;   // for SCHEDULED
    public Long senderId; // optional, for admin sender
    public Boolean active; // optional, for SCHEDULED notifications
}
