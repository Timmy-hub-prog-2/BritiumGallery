package com.maven.demo.entity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Targeted recipient (null for broadcast)
    @ManyToOne(optional = true)
    @JoinColumn(name = "recipient_id")
    private UserEntity recipient;

    // Optional sender (admin or another user). Null means system.
    @ManyToOne(optional = true)
    @JoinColumn(name = "sender_id")
    private UserEntity sender;



    // VIP, NORMAL, etc. Only used if you want to segment within role
    @Column(name = "target_user_type")
    private String targetUserType;

    // Optional: Enum for origin type
    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    private NotificationSource source = NotificationSource.SYSTEM; // SYSTEM, ADMIN, USER

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    // ORDER, STOCK, SYSTEM, REFUND, etc.
    @Column(name = "type")
    private String type;

    // Optional: Link to related object like orderId, refundId, etc.
    @Column(name = "related_object_id")
    private Long relatedObjectId;

    // For frontend "unread" badge
    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Optional: auto-expire system-wide banners or promos
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "notification", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<NotificationTargetRoleEntity> targetRoles = new HashSet<>();

    @Column(name = "action_link")
    private String actionLink;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_mode")
    private NotificationMode mode = NotificationMode.INSTANT; // INSTANT or SCHEDULED


    @OneToMany(mappedBy = "notification", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<NotificationTargetCustomerTypeEntity> targetCustomerTypes = new HashSet<>();

    @Column(name = "last_pushed_at")
    private LocalDateTime lastPushedAt;

    // Manual getter and setter for lastPushedAt in case Lombok doesn't generate them
    public LocalDateTime getLastPushedAt() {
        return lastPushedAt;
    }

    public void setLastPushedAt(LocalDateTime lastPushedAt) {
        this.lastPushedAt = lastPushedAt;
    }

}
