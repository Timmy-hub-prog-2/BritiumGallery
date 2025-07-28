package com.maven.demo.repository;

import com.maven.demo.entity.VariantEditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VariantEditHistoryRepository extends JpaRepository<VariantEditHistory, Long> {
    List<VariantEditHistory> findByVariantIdOrderByCreatedAtDesc(Long variantId);
} 