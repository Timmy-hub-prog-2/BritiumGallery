package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.maven.demo.entity.OrderDetailEntity;
 
@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetailEntity, Long> {
} 