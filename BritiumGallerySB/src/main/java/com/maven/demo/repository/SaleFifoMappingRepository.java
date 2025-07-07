package com.maven.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.OrderDetailEntity;
import com.maven.demo.entity.SaleFifoMappingEntity;

@Repository
public interface SaleFifoMappingRepository extends JpaRepository<SaleFifoMappingEntity, Long> {
    List<SaleFifoMappingEntity> findByOrderDetail(OrderDetailEntity orderDetail);
} 