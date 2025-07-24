package com.maven.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.OrderDetailEntity;
import com.maven.demo.entity.RefundRequestEntity;
import com.maven.demo.entity.RefundStatus;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequestEntity, Long> {
    List<RefundRequestEntity> findByStatus(RefundStatus status);
    List<RefundRequestEntity> findByOrderId(Long orderId);
    List<RefundRequestEntity> findByOrderDetail(OrderDetailEntity orderDetail);
    List<RefundRequestEntity> findByOrder_User_Id(Long userId);
    List<RefundRequestEntity> findByOrderDetail_Variant_Id(Long variantId);
    List<RefundRequestEntity> findByOrderDetail_Variant_Product_Id(Long productId);
} 