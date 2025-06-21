package com.maven.demo.repository;

import com.maven.demo.entity.ShopAddressEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopAddressRepository extends JpaRepository<ShopAddressEntity, Long> {
    List<ShopAddressEntity> findByUserId(Long userId);
    Optional<ShopAddressEntity> findByUserIdAndMainAddressTrue(Long userId);


}