package com.maven.demo.repository;

import com.maven.demo.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByCode(String code);  // ← Correct name!
    void deleteByCode(String code);
}
