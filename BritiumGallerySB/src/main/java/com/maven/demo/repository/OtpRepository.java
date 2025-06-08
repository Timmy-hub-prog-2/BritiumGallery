package com.maven.demo.repository;

import com.maven.demo.entity.OtpEntity;
import com.maven.demo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, Long> {

    // Find the latest OTP for a user (ordered by newest)
    Optional<OtpEntity> findTopByUserOrderByCreatedAtDesc(UserEntity user);

    // Delete all OTPs by user (used before creating a new one)
    void deleteByUser(UserEntity user);

    List<OtpEntity> findAllByUser(UserEntity user);
}
