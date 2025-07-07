package com.maven.demo.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.maven.demo.dto.NotificationDTO;
import com.maven.demo.entity.NotificationEntity;
import com.maven.demo.entity.NotificationMode;
import com.maven.demo.entity.NotificationTargetCustomerTypeEntity;
import com.maven.demo.entity.NotificationTargetRoleEntity;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.OrderStatus;
import com.maven.demo.entity.RoleEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.CustomerTypeRepository;
import com.maven.demo.repository.NotificationRepository;
import com.maven.demo.repository.NotificationTargetCustomerTypeRepository;
import com.maven.demo.repository.NotificationTargetRoleRepository;
import com.maven.demo.repository.OrderRepository;
import com.maven.demo.repository.RoleRepository;
import com.maven.demo.repository.UserRepository;

@Service
public class PendingOrderNotificationService {

    @PostConstruct
    public void init() {
        System.out.println("🚀 PendingOrderNotificationService initialized successfully!");
        System.out.println("⏰ Scheduled job will run every minute for testing");
    }

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CustomerTypeRepository customerTypeRepository;

    @Autowired
    private NotificationTargetRoleRepository notificationTargetRoleRepository;

    @Autowired
    private NotificationTargetCustomerTypeRepository notificationTargetCustomerTypeRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Test method to verify service is working
    public String testService() {
        System.out.println("🧪 Testing PendingOrderNotificationService...");
        try {
            long orderCount = orderRepository.count();
            long notificationCount = notificationRepository.count();
            System.out.println("📊 Database stats - Orders: " + orderCount + ", Notifications: " + notificationCount);
            return "Service is working. Orders: " + orderCount + ", Notifications: " + notificationCount;
        } catch (Exception e) {
            System.err.println("❌ Service test failed: " + e.getMessage());
            e.printStackTrace();
            return "Service test failed: " + e.getMessage();
        }
    }

    // Manual trigger method for testing
    @Transactional
    public void manuallyTriggerPaymentDueCheck() {
        System.out.println("🔔 MANUAL TRIGGER: Payment Due Check Started at " + LocalDateTime.now());
        try {
            checkPendingOrdersForPaymentDue();
        } catch (Exception e) {
            System.err.println("❌ ERROR in Manual Payment Due Check: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Manual trigger for specific order
    @Transactional
    public void manuallyTriggerPaymentDueForOrder(Long orderId) {
        System.out.println("=== Manual Payment Due Check for Order " + orderId + " ===");
        
        OrderEntity order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            System.out.println("Order not found: " + orderId);
            return;
        }
        
        if (order.getStatus() != OrderStatus.PENDING) {
            System.out.println("Order is not pending: " + order.getStatus());
            return;
        }
        
        if (order.getOrderDate() == null || order.getUser() == null) {
            System.out.println("Order missing date or user");
            return;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime paymentDueTime = order.getOrderDate().plus(3, ChronoUnit.DAYS);
        long hoursUntilDue = ChronoUnit.HOURS.between(now, paymentDueTime);
        
        System.out.println("Order " + order.getTrackingCode() + " (ID: " + order.getId() + "):");
        System.out.println("  Order date: " + order.getOrderDate());
        System.out.println("  Payment due: " + paymentDueTime);
        System.out.println("  Hours until due: " + hoursUntilDue);
        
        // Force send notification regardless of time
        if (!hasRecentPaymentDueNotification(order.getId())) {
            System.out.println("  ✅ Sending notification (manual trigger)");
            sendPaymentDueNotification(order);
        } else {
            System.out.println("  ❌ Recent notification exists - not sending");
        }
    }

    // Run every minute for testing (change back to "0 */30 * * * *" for production)
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void checkPendingOrdersForPaymentDue() {
        System.out.println("🔔 SCHEDULED JOB: Payment Due Check Started at " + LocalDateTime.now());
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime sixHoursFromNow = now.plus(6, ChronoUnit.HOURS);
            
            System.out.println("=== Payment Due Check Started ===");
            System.out.println("Current time: " + now);
            System.out.println("Six hours from now: " + sixHoursFromNow);
        
        // Get all pending orders
        List<OrderEntity> pendingOrders = orderRepository.findByStatusOrderByOrderDateDesc(OrderStatus.PENDING);
        System.out.println("Found " + pendingOrders.size() + " pending orders");
        
        for (OrderEntity order : pendingOrders) {
            if (order.getOrderDate() == null || order.getUser() == null) {
                System.out.println("Skipping order " + order.getId() + " - missing order date or user");
                continue;
            }
            
            // Calculate payment due time (3 days from order date)
            LocalDateTime paymentDueTime = order.getOrderDate().plus(3, ChronoUnit.DAYS);
            long hoursUntilDue = ChronoUnit.HOURS.between(now, paymentDueTime);
            
            System.out.println("Order " + order.getTrackingCode() + " (ID: " + order.getId() + "):");
            System.out.println("  Order date: " + order.getOrderDate());
            System.out.println("  Payment due: " + paymentDueTime);
            System.out.println("  Hours until due: " + hoursUntilDue);
            
            // Check if payment is due within 6 hours (including past due)
            if (paymentDueTime.isBefore(sixHoursFromNow) && paymentDueTime.isAfter(now.minus(1, ChronoUnit.HOURS))) {
                System.out.println("  ✅ Payment due within 6 hours - checking for recent notifications");
                
                // Check if we already sent a notification for this order in the last 6 hours
                if (!hasRecentPaymentDueNotification(order.getId())) {
                    System.out.println("  ✅ No recent notification found - sending notification");
                    sendPaymentDueNotification(order);
                } else {
                    System.out.println("  ❌ Recent notification already sent - skipping");
                }
            } else {
                System.out.println("  ❌ Payment not due within 6 hours - skipping");
            }
        }
        System.out.println("=== Payment Due Check Completed ===");
        } catch (Exception e) {
            System.err.println("❌ ERROR in Payment Due Check: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private boolean hasRecentPaymentDueNotification(Long orderId) {
        try {
            LocalDateTime sixHoursAgo = LocalDateTime.now().minus(6, ChronoUnit.HOURS);
            
            System.out.println("  🔍 Checking for recent notifications for order " + orderId);
            System.out.println("  Looking for notifications after: " + sixHoursAgo);
            
            // Check if there's a recent notification for this order
            List<NotificationEntity> recentNotifications = notificationRepository
                .findByRelatedObjectIdAndTypeAndCreatedAtAfter(orderId, "PAYMENT_DUE", sixHoursAgo);
            
            System.out.println("  Found " + recentNotifications.size() + " recent notifications");
            for (NotificationEntity notif : recentNotifications) {
                System.out.println("    - Notification ID: " + notif.getId() + ", Created: " + notif.getCreatedAt());
            }
            
            return !recentNotifications.isEmpty();
        } catch (Exception e) {
            System.err.println("❌ ERROR checking recent notifications: " + e.getMessage());
            e.printStackTrace();
            return false; // Assume no recent notifications if there's an error
        }
    }

    private void sendPaymentDueNotification(OrderEntity order) {
        System.out.println("📧 Creating payment due notification for order " + order.getTrackingCode() + " (ID: " + order.getId() + ")");
        
        UserEntity user = order.getUser();
        if (user == null) {
            System.out.println("❌ User is null for order " + order.getId());
            return;
        }

        try {
            // Create notification entity
            NotificationEntity notification = new NotificationEntity();
            notification.setTitle("Payment Due Soon");
            notification.setMessage(createPaymentDueMessage(order));
            notification.setType("PAYMENT_DUE");
            notification.setRelatedObjectId(order.getId());
            notification.setMode(NotificationMode.INSTANT);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setActionLink("/customer-order-detail/" + order.getId());
            
            System.out.println("💾 Saving notification to database...");
            // Save notification
            notification = notificationRepository.save(notification);
            System.out.println("✅ Notification saved with ID: " + notification.getId());

        // Create role targeting for customer role
        RoleEntity customerRole = roleRepository.findByType("CUSTOMER").orElse(null);
        if (customerRole != null) {
            NotificationTargetRoleEntity targetRole = new NotificationTargetRoleEntity();
            targetRole.setNotification(notification);
            targetRole.setRole(customerRole);
            notificationTargetRoleRepository.save(targetRole);
        }

        // Create customer type targeting if user has a customer type
        if (user.getCustomerType() != null) {
            NotificationTargetCustomerTypeEntity targetCT = new NotificationTargetCustomerTypeEntity();
            targetCT.setNotification(notification);
            targetCT.setCustomerType(user.getCustomerType());
            notificationTargetCustomerTypeRepository.save(targetCT);
        }

        // Send via WebSocket to the specific user
        NotificationDTO dto = NotificationDTO.fromEntity(notification);
        messagingTemplate.convertAndSend("/topic/notifications.user." + user.getId(), dto);
        
        System.out.println("✅ Payment due notification sent to user " + user.getId() + " for order " + order.getTrackingCode());
        } catch (Exception e) {
            System.err.println("❌ ERROR creating payment due notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String createPaymentDueMessage(OrderEntity order) {
        LocalDateTime paymentDueTime = order.getOrderDate().plus(3, ChronoUnit.DAYS);
        LocalDateTime now = LocalDateTime.now();
        long hoursLeft = ChronoUnit.HOURS.between(now, paymentDueTime);
        long minutesLeft = ChronoUnit.MINUTES.between(now, paymentDueTime) % 60;
        
        String timeLeft = hoursLeft > 0 ? 
            hoursLeft + " hour" + (hoursLeft > 1 ? "s" : "") + 
            (minutesLeft > 0 ? " and " + minutesLeft + " minute" + (minutesLeft > 1 ? "s" : "") : "") :
            minutesLeft + " minute" + (minutesLeft > 1 ? "s" : "");
        
        return String.format(
            "⚠️ <b>Payment Due Alert</b><br><br>" +
            "Your order <b>#%s</b> payment is due in <b style='color:red;'>%s</b>.<br><br>" +
            "💰 <b>Total Amount:</b> MMK %s<br><br>" +
            "Please complete your payment to avoid order cancellation. " +
            "You can make payment through your order details page.",
            order.getTrackingCode(),
            timeLeft,
            order.getTotal()
        );
    }
} 