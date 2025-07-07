package com.maven.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.NotificationTargetRoleEntity;
import com.maven.demo.entity.RoleEntity;

@Repository
public interface NotificationTargetRoleRepository extends JpaRepository<NotificationTargetRoleEntity, Long> {
    List<NotificationTargetRoleEntity> findByRole(RoleEntity role);
    List<NotificationTargetRoleEntity> findByNotification(com.maven.demo.entity.NotificationEntity notification);
    List<NotificationTargetRoleEntity> findByRoleId(Long roleId);
} 