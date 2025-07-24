package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.maven.demo.entity.OrderDetailEntity;
import java.util.List;
 
@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetailEntity, Long> {
    List<OrderDetailEntity> findByVariant_Id(Long variantId);
    List<OrderDetailEntity> findByVariant_Product_Id(Long productId);
} 