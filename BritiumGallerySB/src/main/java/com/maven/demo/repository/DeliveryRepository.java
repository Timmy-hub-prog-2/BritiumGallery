package com.maven.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.DeliveryEntity;

@Repository
public interface DeliveryRepository extends JpaRepository<DeliveryEntity, Integer> {

    // Legacy methods for backward compatibility
    Optional<DeliveryEntity> findByTypeIgnoreCaseAndNameIgnoreCase(String type, String name);
    
    // New methods for the updated structure
    List<DeliveryEntity> findByDeliveryTypeIgnoreCase(String deliveryType);
    List<DeliveryEntity> findByDeliveryTypeIgnoreCaseAndSpeedTypeIgnoreCase(String deliveryType, String speedType);
}
