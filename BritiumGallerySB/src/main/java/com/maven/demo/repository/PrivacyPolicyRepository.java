package com.maven.demo.repository;

import com.maven.demo.entity.PrivacyPolicyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrivacyPolicyRepository extends JpaRepository<PrivacyPolicyEntity, Long> {
    Optional<PrivacyPolicyEntity> findFirstByActiveTrueOrderByUpdatedAtDesc();
}
