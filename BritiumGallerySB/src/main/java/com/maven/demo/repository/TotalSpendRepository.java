package com.maven.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.TotalSpendEntity;
import com.maven.demo.entity.UserEntity;

@Repository
public interface TotalSpendRepository extends JpaRepository<TotalSpendEntity, Long> {
    Optional<TotalSpendEntity> findByUser(UserEntity user);
} 