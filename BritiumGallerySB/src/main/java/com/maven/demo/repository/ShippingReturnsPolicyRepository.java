package com.maven.demo.repository;

import com.maven.demo.entity.ShippingReturnsPolicyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingReturnsPolicyRepository extends JpaRepository<ShippingReturnsPolicyEntity, Long> {
    List<ShippingReturnsPolicyEntity> findAllByOrderByDisplayOrderAsc();
}
