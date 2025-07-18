package com.maven.demo.repository;

import com.maven.demo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    boolean existsByEmail(String email);
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);
    Optional<UserEntity> findById(Long id);
    List<UserEntity> findByRoleId(Long roleId);
    List<UserEntity> findByCustomerTypeId(Long customerTypeId);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.imageUrls WHERE u.id = :id")
    Optional<UserEntity> findByIdWithImageUrls(@Param("id") Long id);
}
