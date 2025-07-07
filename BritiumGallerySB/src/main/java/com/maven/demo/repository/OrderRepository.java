package com.maven.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.OrderDetailEntity;
import com.maven.demo.entity.OrderEntity;
import com.maven.demo.entity.OrderStatus;
import com.maven.demo.entity.UserEntity;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    List<OrderEntity> findByUserOrderByOrderDateDesc(UserEntity user);
    List<OrderEntity> findByUserAndStatusOrderByOrderDateDesc(UserEntity user, OrderStatus status);
    List<OrderEntity> findByStatusOrderByOrderDateDesc(OrderStatus status);
    
    @Query("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.orderDetails od LEFT JOIN FETCH od.variant v LEFT JOIN FETCH v.product WHERE o.id = :orderId")
    Optional<OrderEntity> findByIdWithDetails(@Param("orderId") Long orderId);
    
    @Query("SELECT DISTINCT o FROM OrderEntity o LEFT JOIN FETCH o.orderDetails od LEFT JOIN FETCH od.variant v LEFT JOIN FETCH v.product WHERE o.user = :user ORDER BY o.orderDate DESC")
    List<OrderEntity> findByUserWithDetailsOrderByOrderDateDesc(@Param("user") UserEntity user);
    
    @Query("SELECT DISTINCT o FROM OrderEntity o LEFT JOIN FETCH o.orderDetails od LEFT JOIN FETCH od.variant v LEFT JOIN FETCH v.product WHERE o.user = :user AND o.status = :status ORDER BY o.orderDate DESC")
    List<OrderEntity> findByUserAndStatusWithDetailsOrderByOrderDateDesc(@Param("user") UserEntity user, @Param("status") OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM OrderEntity o LEFT JOIN FETCH o.orderDetails od LEFT JOIN FETCH od.variant v LEFT JOIN FETCH v.product WHERE o.status = :status")
    List<OrderEntity> findByStatusWithDetails(@Param("status") OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM OrderEntity o LEFT JOIN FETCH o.orderDetails od LEFT JOIN FETCH od.variant v LEFT JOIN FETCH v.product ORDER BY o.orderDate DESC")
    List<OrderEntity> findAllWithDetailsOrderByOrderDateDesc();
    
    @Query("SELECT od FROM OrderDetailEntity od WHERE od.variant.id = :variantId")
    List<OrderDetailEntity> findOrderDetailsByVariant(@Param("variantId") Long variantId);
    
    @Query("SELECT od FROM OrderDetailEntity od WHERE od.variant.product.id = :productId")
    List<OrderDetailEntity> findOrderDetailsByProduct(@Param("productId") Long productId);
    
    @Query("SELECT od FROM OrderDetailEntity od")
    List<OrderDetailEntity> findAllOrderDetails();

    Optional<OrderEntity> findByTrackingCode(String trackingCode);
} 