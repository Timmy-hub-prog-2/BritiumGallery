package com.maven.demo.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.maven.demo.entity.NotificationTargetCustomerTypeEntity;
import com.maven.demo.entity.NotificationEntity;

@Repository
public interface NotificationTargetCustomerTypeRepository extends JpaRepository<NotificationTargetCustomerTypeEntity, Long> {
    List<NotificationTargetCustomerTypeEntity> findByNotification(NotificationEntity notification);
    List<NotificationTargetCustomerTypeEntity> findByCustomerTypeId(Long customerTypeId);
} 