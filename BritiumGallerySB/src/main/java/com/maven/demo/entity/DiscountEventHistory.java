package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "discount_event_history")
@Getter
@Setter
public class DiscountEventHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "action", nullable = false)
    private String action; // "CREATED", "UPDATED", "ACTIVATED", "DEACTIVATED"

    @Column(name = "old_values", columnDefinition = "TEXT")
    private String oldValues; // JSON string of old values

    @Column(name = "new_values", columnDefinition = "TEXT")
    private String newValues; // JSON string of new values

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 