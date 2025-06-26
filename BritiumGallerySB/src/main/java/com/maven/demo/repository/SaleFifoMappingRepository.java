package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.SaleFifoMappingEntity;

@Repository
public interface SaleFifoMappingRepository extends JpaRepository<SaleFifoMappingEntity, Long> {
} 