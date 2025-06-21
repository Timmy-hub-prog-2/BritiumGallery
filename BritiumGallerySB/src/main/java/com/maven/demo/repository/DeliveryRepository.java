package com.maven.demo.repository;

import com.maven.demo.entity.DeliveryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<DeliveryEntity, Integer> {

    Optional<DeliveryEntity> findByTypeIgnoreCaseAndNameIgnoreCase(String type, String name);
}
