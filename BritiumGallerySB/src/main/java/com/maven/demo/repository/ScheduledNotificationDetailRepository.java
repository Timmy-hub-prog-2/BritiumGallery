package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.demo.entity.ScheduledNotificationDetail;

public interface ScheduledNotificationDetailRepository extends JpaRepository<ScheduledNotificationDetail, Long> {
    ScheduledNotificationDetail findByNotification(com.maven.demo.entity.NotificationEntity notification);
}