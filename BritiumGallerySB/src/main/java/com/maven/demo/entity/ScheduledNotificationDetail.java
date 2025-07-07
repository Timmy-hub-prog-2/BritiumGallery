package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_notification_details")
@Getter
@Setter
public class ScheduledNotificationDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id", nullable = false)
    private NotificationEntity notification;

    @Column(nullable = false)
    private String cronExpression; // e.g., "0 0 9 ? * SUN"

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private boolean active = true;
}

