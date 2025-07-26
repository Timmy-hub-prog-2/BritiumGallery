package com.maven.demo.service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cronutils.model.Cron;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import com.maven.demo.dto.NotificationDTO;
import com.maven.demo.entity.NotificationEntity;
import com.maven.demo.entity.NotificationTargetCustomerTypeEntity;
import com.maven.demo.entity.NotificationTargetRoleEntity;
import com.maven.demo.entity.ScheduledNotificationDetail;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.NotificationRepository;
import com.maven.demo.repository.ScheduledNotificationDetailRepository;
import com.maven.demo.repository.UserRepository;

@Service
public class NotificationScheduler {

    @Autowired
    private ScheduledNotificationDetailRepository scheduledNotificationDetailRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final CronParser quartzParser = new CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.QUARTZ));
    private static final CronParser unixParser = new CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX));

    @Scheduled(cron = "0 * * * * *") // every minute
    @Transactional
    public void pushDueScheduledNotifications() {
        ZoneId zone = ZoneId.of("Asia/Rangoon");
        ZonedDateTime now = ZonedDateTime.now(zone).withSecond(0).withNano(0);
        System.out.println("=== Scheduler running at: " + now + " ===");
        List<ScheduledNotificationDetail> all = scheduledNotificationDetailRepository.findAll();
        for (ScheduledNotificationDetail sched : all) {
            System.out.println("Checking notification " + sched.getNotification().getId() +
                " cron: " + sched.getCronExpression() +
                " start: " + sched.getStartDate() +
                " end: " + sched.getEndDate() +
                " active: " + sched.isActive());
            
            // Check each condition separately for debugging
            boolean isActive = sched.isActive();
            boolean startDateOk = sched.getStartDate() == null || !now.toLocalDateTime().isBefore(sched.getStartDate());
            boolean endDateOk = sched.getEndDate() == null || !now.toLocalDateTime().isAfter(sched.getEndDate());
            boolean cronDue = isDueNow(sched.getCronExpression(), now);
            
            System.out.println("  [DEBUG] Conditions: active=" + isActive + 
                             ", startDateOk=" + startDateOk + " (start=" + sched.getStartDate() + ", now=" + now.toLocalDateTime() + ")" +
                             ", endDateOk=" + endDateOk + " (end=" + sched.getEndDate() + ", now=" + now.toLocalDateTime() + ")" +
                             ", cronDue=" + cronDue);
            
            boolean due = isActive && startDateOk && endDateOk && cronDue;
            System.out.println("  Is due? " + due);
            if (!due) continue;
            NotificationEntity notification = sched.getNotification();
            if (notification.getLastPushedAt() != null && notification.getLastPushedAt().isEqual(now.toLocalDateTime())) {
                System.out.println("  Already pushed at this time, skipping.");
                continue;
            }
            notification.setLastPushedAt(now.toLocalDateTime());
            notificationRepository.save(notification);
            
            // Send to users with the targeted roles (with customer type filtering for customer role)
            for (NotificationTargetRoleEntity targetRole : notification.getTargetRoles()) {
                if (targetRole.getRole().getId() == 3L) {
                    // For customer role, only send to users with matching customer types
                    if (!notification.getTargetCustomerTypes().isEmpty()) {
                        for (NotificationTargetCustomerTypeEntity targetCT : notification.getTargetCustomerTypes()) {
                            List<UserEntity> users = userRepository.findByCustomerTypeId(targetCT.getCustomerType().getId());
                            for (UserEntity user : users) {
                                System.out.println("  Pushing notification " + notification.getId() + " to customer user " + user.getId() + " (customer type: " + user.getCustomerType().getType() + ")");
                                messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), NotificationDTO.fromEntity(notification));
                            }
                        }
                    } else {
                        System.out.println("  Skipping customer role notification " + notification.getId() + " - no customer types specified");
                    }
                } else {
                    // For non-customer roles, send to all users with that role
                    List<UserEntity> users = userRepository.findByRoleId(targetRole.getRole().getId());
                    for (UserEntity user : users) {
                        System.out.println("  Pushing notification " + notification.getId() + " to user " + user.getId());
                        messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), NotificationDTO.fromEntity(notification));
                    }
                }
            }
        }
    }

    private boolean isDueNow(String cronExpression, ZonedDateTime now) {
        try {
            String expr = cronExpression.trim();
            String[] parts = expr.split("\\s+");
            
            System.out.println("  [DEBUG] Parsing cron: " + expr + " with " + parts.length + " parts");
            
            int partCount = parts.length;
            CronParser parser;
            if (partCount == 5) {
                parser = unixParser;
            } else if (partCount == 6 || partCount == 7) {
                parser = quartzParser;
            } else {
                System.out.println("Unsupported cron format (must be 5 for UNIX or 6/7 for Quartz): " + cronExpression);
                return false;
            }
            
            // Parse the cron expression
            Cron cron = parser.parse(expr);
            ExecutionTime executionTime = ExecutionTime.forCron(cron);
            
            // Check if the current time matches the cron expression
            boolean isMatch = executionTime.isMatch(now);
            System.out.println("  [DEBUG] Cron match check: " + isMatch + " for time: " + now);
            
            if (isMatch) {
                // For scheduled notifications, if the cron matches, we should execute
                // The scheduler runs every minute, so we need to ensure we don't execute multiple times
                // We'll use the notification's lastPushedAt field to prevent duplicate executions
                System.out.println("  [DEBUG] Cron matches current time - should execute");
                return true;
            }
            
            System.out.println("  [DEBUG] Not due - cron does not match current time");
            return false;
            
        } catch (Exception e) {
            System.out.println("Cron parse error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    

} 