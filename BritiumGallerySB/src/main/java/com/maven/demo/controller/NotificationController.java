package com.maven.demo.controller;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.maven.demo.dto.CreateNotificationRequest;
import com.maven.demo.dto.NotificationDTO;
import com.maven.demo.dto.ScheduledNotificationDTO;
import com.maven.demo.entity.CustomerTypeEntity;
import com.maven.demo.entity.NotificationEntity;
import com.maven.demo.entity.NotificationTargetCustomerTypeEntity;
import com.maven.demo.entity.NotificationTargetRoleEntity;
import com.maven.demo.entity.RoleEntity;
import com.maven.demo.entity.ScheduledNotificationDetail;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.CustomerTypeRepository;
import com.maven.demo.repository.NotificationRepository;
import com.maven.demo.repository.NotificationTargetCustomerTypeRepository;
import com.maven.demo.repository.NotificationTargetRoleRepository;
import com.maven.demo.repository.RoleRepository;
import com.maven.demo.repository.ScheduledNotificationDetailRepository;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.service.NotificationService;
import com.maven.demo.service.PendingOrderNotificationService;
import com.maven.demo.service.NotificationScheduler;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private NotificationTargetRoleRepository notificationTargetRoleRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private CustomerTypeRepository customerTypeRepository;
    @Autowired(required = false)
    private ScheduledNotificationDetailRepository scheduledNotificationDetailRepository;
    @Autowired
    private NotificationTargetCustomerTypeRepository notificationTargetCustomerTypeRepository;
    @Autowired
    private NotificationScheduler notificationScheduler;
    
    @Autowired
    private PendingOrderNotificationService pendingOrderNotificationService;

    // Get notifications for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDTO>> getNotificationsForUser(@PathVariable Long userId) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        
        // Direct notifications
        List<NotificationEntity> notifications = notificationRepository.findByRecipient(user);
        
        // Role-targeted notifications (with customer type restriction check)
        if (user.getRole() != null) {
            List<NotificationTargetRoleEntity> roleTargets = notificationTargetRoleRepository.findByRoleId(user.getRole().getId());
            
            for (NotificationTargetRoleEntity roleTarget : roleTargets) {
                NotificationEntity notification = roleTarget.getNotification();
                
                // For scheduled notifications, check date range
                if (notification.getMode() == com.maven.demo.entity.NotificationMode.SCHEDULED) {
                    ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(notification);
                    if (sched != null) {
                        // Check if notification is within valid date range
                        if (sched.getStartDate() != null && now.isBefore(sched.getStartDate())) {
                            continue;
                        }
                        if (sched.getEndDate() != null && now.isAfter(sched.getEndDate())) {
                            continue;
                        }
                        if (!sched.isActive()) {
                            continue;
                        }
                    } else {
                        continue; // Skip if no schedule details
                    }
                }
                
                // Check if this notification has customer type restrictions
                List<NotificationTargetCustomerTypeEntity> ctTargetsForNotification =
                    notificationTargetCustomerTypeRepository.findByNotification(notification);
                
                // For customer role (id=3), always check customer type restrictions
                if (user.getRole().getId() == 3L) {
                    if (ctTargetsForNotification == null || ctTargetsForNotification.isEmpty()) {
                        // No customer type restrictions set, skip this notification for customer role
                        continue;
                    } else if (user.getCustomerType() != null) {
                        // Only add if user's customer type matches one of the restrictions
                        boolean matches = ctTargetsForNotification.stream()
                            .anyMatch(ct -> ct.getCustomerType().getId().equals(user.getCustomerType().getId()));
                        if (matches) {
                            notifications.add(notification);
                        }
                    }
                } else {
                    // For non-customer roles, use original logic
                    if (ctTargetsForNotification == null || ctTargetsForNotification.isEmpty()) {
                        // No customer type restriction, add for all users with this role
                        notifications.add(notification);
                    } else if (user.getCustomerType() != null) {
                        // Only add if user's customer type matches one of the restrictions
                        boolean matches = ctTargetsForNotification.stream()
                            .anyMatch(ct -> ct.getCustomerType().getId().equals(user.getCustomerType().getId()));
                        if (matches) {
                            notifications.add(notification);
                        }
                    }
                }
            }
        }
        
        // Customer-type-targeted notifications
        if (user.getCustomerType() != null) {
            List<NotificationTargetCustomerTypeEntity> ctTargets = notificationTargetCustomerTypeRepository.findByCustomerTypeId(user.getCustomerType().getId());
            
            for (NotificationTargetCustomerTypeEntity ctTarget : ctTargets) {
                NotificationEntity notification = ctTarget.getNotification();
                
                // For scheduled notifications, check date range
                if (notification.getMode() == com.maven.demo.entity.NotificationMode.SCHEDULED) {
                    ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(notification);
                    if (sched != null) {
                        // Check if notification is within valid date range
                        if (sched.getStartDate() != null && now.isBefore(sched.getStartDate())) {
                            continue;
                        }
                        if (sched.getEndDate() != null && now.isAfter(sched.getEndDate())) {
                            continue;
                        }
                        if (!sched.isActive()) {
                            continue;
                        }
                    } else {
                        continue; // Skip if no schedule details
                    }
                }
                
                notifications.add(notification);
            }
        }
        
        // Deduplicate by notification ID
        List<NotificationDTO> dtos = notifications.stream()
            .distinct()
            .map(NotificationDTO::fromEntity)
            .sorted((a, b) -> b.id.compareTo(a.id))
            .toList();
        
        return ResponseEntity.ok(dtos);
    }

    // Mark a notification as read
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        NotificationEntity notification = notificationRepository.findById(id).orElse(null);
        if (notification == null) return ResponseEntity.notFound().build();
        notification.setRead(true);
        notificationRepository.save(notification);
        // Send update via WebSocket
        NotificationDTO dto = NotificationDTO.fromEntity(notification);
        if ("STOCK".equals(notification.getType())) {
            // Broadcast to all admins for stock notifications
            List<UserEntity> admins = userRepository.findByRoleId(2L);
            for (UserEntity admin : admins) {
                messagingTemplate.convertAndSend("/topic/notifications.user." + admin.getId(), dto);
            }
        } else {
            // Check if this notification is role-targeted
            List<NotificationTargetRoleEntity> targetRoles = notificationTargetRoleRepository.findByNotification(notification);
            boolean sentToRole = false;
            if (targetRoles != null && !targetRoles.isEmpty()) {
                for (NotificationTargetRoleEntity targetRole : targetRoles) {
                    if (targetRole.getRole().getId() == 3L) {
                        // For customer role, only send to users with matching customer types
                        List<NotificationTargetCustomerTypeEntity> targetCustomerTypes = notificationTargetCustomerTypeRepository.findByNotification(notification);
                        if (targetCustomerTypes != null && !targetCustomerTypes.isEmpty()) {
                            for (NotificationTargetCustomerTypeEntity targetCT : targetCustomerTypes) {
                                List<UserEntity> users = userRepository.findByCustomerTypeId(targetCT.getCustomerType().getId());
                                for (UserEntity user : users) {
                                    messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), dto);
                                }
                            }
                        }
                        // If no customer types specified, don't send to any customers
                    } else {
                        // For non-customer roles, send to all users with that role
                        List<UserEntity> users = userRepository.findByRoleId(targetRole.getRole().getId());
                        for (UserEntity user : users) {
                            messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), dto);
                        }
                    }
                }
                sentToRole = true;
            }
            // Check if this notification is customer-type-targeted (direct targeting)
            List<NotificationTargetCustomerTypeEntity> targetCustomerTypes = notificationTargetCustomerTypeRepository.findByNotification(notification);
            boolean sentToCustomerType = false;
            if (targetCustomerTypes != null && !targetCustomerTypes.isEmpty()) {
                for (NotificationTargetCustomerTypeEntity targetCT : targetCustomerTypes) {
                    List<UserEntity> users = userRepository.findByCustomerTypeId(targetCT.getCustomerType().getId());
                    for (UserEntity user : users) {
                        messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), dto);
                    }
                }
                sentToCustomerType = true;
            }
            if (!sentToRole && !sentToCustomerType) {
                // Default: only to recipient
                messagingTemplate.convertAndSend("/topic/notifications.user." + notification.getRecipient().getId(), dto);
            }
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "Notification marked as read"));
    }

    // (Optional) Get all notifications for admin
    @GetMapping("/admin")
    public ResponseEntity<List<NotificationEntity>> getAllNotificationsForAdmin() {
        List<NotificationEntity> notifications = notificationRepository.findAll();
        return ResponseEntity.ok(notifications);
    }

    // Get notifications for admin role
    @GetMapping(value = "/admin/targeted", produces = "application/json")
    public ResponseEntity<List<NotificationDTO>> getNotificationsForAdminRole() {
        // Find admin role
        RoleEntity adminRole = roleRepository.findByType("ADMIN").orElse(null);
        if (adminRole == null) return ResponseEntity.ok(List.of());
        List<NotificationTargetRoleEntity> targeted = notificationTargetRoleRepository.findByRole(adminRole);
        List<NotificationDTO> dtos = targeted.stream()
            .map(NotificationTargetRoleEntity::getNotification)
            .map(NotificationDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    // Create notification (instant or scheduled)
    @PostMapping("/create")
    public ResponseEntity<?> createNotification(@RequestBody CreateNotificationRequest req) {
        // Validate required fields
        if (req.title == null || req.title.isBlank() || req.message == null || req.message.isBlank() || req.type == null || req.type.isBlank() || req.roleIds == null || req.roleIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Missing required fields"));
        }
        NotificationEntity notification = new NotificationEntity();
        notification.setTitle(req.title);
        notification.setMessage(req.message);
        notification.setType(req.type);
        notification.setActionLink(req.actionLink);
        notification.setMode("SCHEDULED".equalsIgnoreCase(req.mode) ? com.maven.demo.entity.NotificationMode.SCHEDULED : com.maven.demo.entity.NotificationMode.INSTANT);
        System.out.println("Creating notification with mode: " + notification.getMode() + " (requested: " + req.mode + ")");
        notification.setCreatedAt(LocalDateTime.now());
        // Set sender if provided
        if (req.senderId != null) {
            UserEntity sender = userRepository.findById(req.senderId).orElse(null);
            if (sender != null) notification.setSender(sender);
        }
        notification = notificationRepository.save(notification);
        // Multi-role targeting
        for (Long roleId : req.roleIds) {
            RoleEntity role = roleRepository.findById(roleId).orElse(null);
            if (role != null) {
                NotificationTargetRoleEntity targetRole = new NotificationTargetRoleEntity();
                targetRole.setNotification(notification);
                targetRole.setRole(role);
                notificationTargetRoleRepository.save(targetRole);
            }
        }
        // Customer type targeting if customer role (id=3) is included
        if (req.roleIds.contains(3L) && req.customerTypeIds != null && !req.customerTypeIds.isEmpty()) {
            for (Long ctId : req.customerTypeIds) {
                CustomerTypeEntity ct = customerTypeRepository.findById(ctId).orElse(null);
                if (ct != null) {
                    NotificationTargetCustomerTypeEntity targetCT = new NotificationTargetCustomerTypeEntity();
                    targetCT.setNotification(notification);
                    targetCT.setCustomerType(ct);
                    notification.getTargetCustomerTypes().add(targetCT);
                }
            }
            notificationRepository.save(notification);
        }
        // Scheduled notification details
        if ("SCHEDULED".equalsIgnoreCase(req.mode)) {
            System.out.println("Creating scheduled notification details:");
            System.out.println("  Cron: " + req.cronExpression);
            System.out.println("  Start: " + req.startDate);
            System.out.println("  End: " + req.endDate);
            
            if (req.cronExpression == null || req.cronExpression.isBlank() || req.startDate == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Missing scheduling fields"));
            }
            ScheduledNotificationDetail sched = new ScheduledNotificationDetail();
            sched.setNotification(notification);
            sched.setCronExpression(req.cronExpression);
            sched.setStartDate(req.startDate);
            sched.setEndDate(req.endDate);
            sched.setActive(req.active != null ? req.active : true);
            scheduledNotificationDetailRepository.save(sched);
            System.out.println("Scheduled notification details saved successfully");
        } else {
            // For instant notifications, send via WebSocket immediately
            NotificationDTO dto = NotificationDTO.fromEntity(notification);
            
            // Send to users with the targeted roles (with customer type filtering for customer role)
            for (Long roleId : req.roleIds) {
                if (roleId == 3L) {
                    // For customer role, only send to users with matching customer types
                    if (req.customerTypeIds != null && !req.customerTypeIds.isEmpty()) {
                        for (Long ctId : req.customerTypeIds) {
                            List<UserEntity> users = userRepository.findByCustomerTypeId(ctId);
                            for (UserEntity user : users) {
                                messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), dto);
                            }
                        }
                    }
                    // If no customer types specified, don't send to any customers
                } else {
                    // For non-customer roles, send to all users with that role
                    List<UserEntity> users = userRepository.findByRoleId(roleId);
                    for (UserEntity user : users) {
                        messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), dto);
                    }
                }
            }
        }
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    // Fetch all roles (DTO)
    @GetMapping("/roles")
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        List<RoleDTO> dtos = roleRepository.findAll().stream()
            .map(r -> new RoleDTO(r.getId(), r.getType()))
            .toList();
        return ResponseEntity.ok(dtos);
    }

    // Fetch all customer types (DTO)
    @GetMapping("/customer-types")
    public ResponseEntity<List<CustomerTypeDTO>> getAllCustomerTypes() {
        List<CustomerTypeDTO> dtos = customerTypeRepository.findAll().stream()
            .map(ct -> new CustomerTypeDTO(ct.getId(), ct.getType()))
            .toList();
        return ResponseEntity.ok(dtos);
    }

    // Fetch all scheduled notifications with their details
    @GetMapping("/scheduled")
    public ResponseEntity<List<ScheduledNotificationDTO>> getAllScheduledNotifications() {
        List<NotificationEntity> scheduled = notificationRepository.findAll().stream()
            .filter(n -> n.getMode() == com.maven.demo.entity.NotificationMode.SCHEDULED)
            .toList();
        List<ScheduledNotificationDTO> dtos = scheduled.stream()
            .map(n -> {
                ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(n);
                List<Long> roleIds = n.getTargetRoles().stream().map(r -> r.getRole().getId()).toList();
                List<Long> customerTypeIds = n.getTargetCustomerTypes().stream().map(ct -> ct.getCustomerType().getId()).toList();
                return new ScheduledNotificationDTO(
                    n.getId(),
                    n.getTitle(),
                    n.getMessage(),
                    n.getType(),
                    n.getCreatedAt(),
                    sched != null ? sched.getStartDate() : null,
                    sched != null ? sched.getEndDate() : null,
                    sched != null ? sched.isActive() : true,
                    roleIds,
                    customerTypeIds,
                    sched != null ? sched.getCronExpression() : null
                );
            })
            .toList();
        return ResponseEntity.ok(dtos);
    }

    // Fetch scheduled notifications for a user (filtered by role/customer type, active, and date)
    @GetMapping("/scheduled/user/{userId}")
    public ResponseEntity<List<ScheduledNotificationDTO>> getScheduledNotificationsForUser(@PathVariable Long userId) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        List<NotificationEntity> allScheduled = notificationRepository.findAll().stream()
            .filter(n -> n.getMode() == com.maven.demo.entity.NotificationMode.SCHEDULED)
            .toList();
        List<ScheduledNotificationDTO> dtos = allScheduled.stream()
            .filter(n -> {
                // Only active
                ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(n);
                if (sched == null || !sched.isActive()) return false;
                // Date window
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                if (sched.getStartDate() != null && now.isBefore(sched.getStartDate())) return false;
                if (sched.getEndDate() != null && now.isAfter(sched.getEndDate())) return false;
                // Role match
                boolean roleMatch = n.getTargetRoles().isEmpty() ||
                    (user.getRole() != null && n.getTargetRoles().stream().anyMatch(r -> r.getRole().getId() == user.getRole().getId()));
                
                // Customer type match (if customer role is targeted)
                boolean ctMatch = true;
                if (user.getRole() != null && user.getRole().getId() == 3L) {
                    // For customer role, always require customer type restrictions to be set and matched
                    if (n.getTargetCustomerTypes().isEmpty()) {
                        // No customer type restrictions set, skip this notification for customer role
                        ctMatch = false;
                    } else {
                        // Check if user's customer type matches one of the restrictions
                        ctMatch = user.getCustomerType() != null && n.getTargetCustomerTypes().stream().anyMatch(ct -> ct.getCustomerType().getId() == user.getCustomerType().getId());
                    }
                }
                return roleMatch && ctMatch;
            })
            .map(n -> {
                ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(n);
                List<Long> roleIds = n.getTargetRoles().stream().map(r -> r.getRole().getId()).toList();
                List<Long> customerTypeIds = n.getTargetCustomerTypes().stream().map(ct -> ct.getCustomerType().getId()).toList();
                return new ScheduledNotificationDTO(
                    n.getId(),
                    n.getTitle(),
                    n.getMessage(),
                    n.getType(),
                    n.getCreatedAt(),
                    sched != null ? sched.getStartDate() : null,
                    sched != null ? sched.getEndDate() : null,
                    sched != null ? sched.isActive() : true,
                    roleIds,
                    customerTypeIds,
                    sched != null ? sched.getCronExpression() : null
                );
            })
            .toList();
        return ResponseEntity.ok(dtos);
    }

    // Update a scheduled notification
    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<?> updateScheduledNotification(@PathVariable Long id, @RequestBody CreateNotificationRequest req) {
        NotificationEntity notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || notification.getMode() != com.maven.demo.entity.NotificationMode.SCHEDULED) {
            return ResponseEntity.notFound().build();
        }
        // Update fields
        notification.setTitle(req.title);
        notification.setMessage(req.message);
        notification.setType(req.type);
        notification.setActionLink(req.actionLink);
        // Update roles
        notification.getTargetRoles().clear();
        if (req.roleIds != null) {
            for (Long roleId : req.roleIds) {
                RoleEntity role = roleRepository.findById(roleId).orElse(null);
                if (role != null) {
                    NotificationTargetRoleEntity targetRole = new NotificationTargetRoleEntity();
                    targetRole.setNotification(notification);
                    targetRole.setRole(role);
                    notificationTargetRoleRepository.save(targetRole);
                }
            }
        }
        // Update customer types
        notification.getTargetCustomerTypes().clear();
        if (req.roleIds != null && req.roleIds.contains(3L) && req.customerTypeIds != null) {
            for (Long ctId : req.customerTypeIds) {
                CustomerTypeEntity ct = customerTypeRepository.findById(ctId).orElse(null);
                if (ct != null) {
                    NotificationTargetCustomerTypeEntity targetCT = new NotificationTargetCustomerTypeEntity();
                    targetCT.setNotification(notification);
                    targetCT.setCustomerType(ct);
                    notificationTargetCustomerTypeRepository.save(targetCT);
                }
            }
        }
        notificationRepository.save(notification);
        // Update schedule details
        ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(notification);
        if (sched != null) {
            sched.setCronExpression(req.cronExpression);
            sched.setStartDate(req.startDate);
            sched.setEndDate(req.endDate);
            // Update active status if provided
            if (req.active != null) {
                sched.setActive(req.active);
            }
            scheduledNotificationDetailRepository.save(sched);
        }
        return ResponseEntity.ok(NotificationDTO.fromEntity(notification));
    }

    // Delete a scheduled notification
    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<?> deleteScheduledNotification(@PathVariable Long id) {
        NotificationEntity notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || notification.getMode() != com.maven.demo.entity.NotificationMode.SCHEDULED) {
            return ResponseEntity.notFound().build();
        }
        // Delete schedule detail if exists
        ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(notification);
        if (sched != null) {
            scheduledNotificationDetailRepository.delete(sched);
        }
        // Delete notification (cascades to target roles/types)
        notificationRepository.delete(notification);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    // Update scheduled notification status (active/inactive)
    @org.springframework.web.bind.annotation.PatchMapping("/{id}/status")
    public ResponseEntity<?> updateScheduledNotificationStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        NotificationEntity notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || notification.getMode() != com.maven.demo.entity.NotificationMode.SCHEDULED) {
            return ResponseEntity.notFound().build();
        }
        
        Boolean active = request.get("active");
        if (active == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Active status is required"));
        }
        
        ScheduledNotificationDetail sched = scheduledNotificationDetailRepository.findByNotification(notification);
        if (sched != null) {
            sched.setActive(active);
            scheduledNotificationDetailRepository.save(sched);
            return ResponseEntity.ok(Collections.singletonMap("success", true));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Manual trigger for payment due notifications (for testing)
    @PostMapping("/admin/notifications/trigger-payment-due")
    public ResponseEntity<String> triggerPaymentDueNotifications() {
        try {
            pendingOrderNotificationService.manuallyTriggerPaymentDueCheck();
            return ResponseEntity.ok("Payment due check triggered successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error triggering payment due check: " + e.getMessage());
        }
    }
    
    // Test endpoint to verify service is working
    @GetMapping("/admin/notifications/test-service")
    public ResponseEntity<String> testService() {
        try {
            String result = pendingOrderNotificationService.testService();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error testing service: " + e.getMessage());
        }
    }

    // Manual trigger for specific order (for testing)
    @PostMapping("/admin/notifications/trigger-payment-due/{orderId}")
    public ResponseEntity<String> triggerPaymentDueForOrder(@PathVariable Long orderId) {
        try {
            pendingOrderNotificationService.manuallyTriggerPaymentDueForOrder(orderId);
            return ResponseEntity.ok("Payment due check triggered for order " + orderId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error triggering payment due check: " + e.getMessage());
        }
    }

    // DTOs for safe frontend response
    public static class RoleDTO {
        public long id;
        public String type;
        public RoleDTO(long id, String type) { this.id = id; this.type = type; }
    }
    public static class CustomerTypeDTO {
        public long id;
        public String name;
        public CustomerTypeDTO(Long id, String name) { this.id = id; this.name = name; }
    }

    // DTO for scheduled notification list


}


