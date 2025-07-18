package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.CustomerServiceSessionEntity;

@Repository
public interface CustomerServiceSessionRepository extends JpaRepository<CustomerServiceSessionEntity, Long> {
    // Add custom query methods if needed
} 