package com.maven.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.TransactionEntity;
import com.maven.demo.entity.TransactionStatus;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
    Optional<TransactionEntity> findByOrder(OrderEntity order);

    List<TransactionEntity> findByStatus(TransactionStatus status);
} 