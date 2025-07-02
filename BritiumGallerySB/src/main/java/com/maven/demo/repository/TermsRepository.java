package com.maven.demo.repository;

import com.maven.demo.entity.TermsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TermsRepository extends JpaRepository<TermsEntity, Long> {
    Optional<TermsEntity> findByActiveTrue();
}
