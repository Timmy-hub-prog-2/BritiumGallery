package com.maven.demo.repository;

import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.WishlistEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistEntity, Long> {
    boolean existsByUserAndProduct(UserEntity user, ProductEntity product);
    List<WishlistEntity> findByUserId(Long userId);

    Optional<WishlistEntity> findByUserAndProduct(UserEntity user, ProductEntity product);

}

