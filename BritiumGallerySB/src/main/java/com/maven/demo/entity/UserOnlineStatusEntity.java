package com.maven.demo.entity;

import com.maven.demo.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_online_status")
@Getter
@Setter
public class UserOnlineStatusEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserEntity user;

    @Column(name = "is_online", nullable = false)
    private boolean online;

    @Column(name = "last_online_at")
    private LocalDateTime lastOnlineAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
