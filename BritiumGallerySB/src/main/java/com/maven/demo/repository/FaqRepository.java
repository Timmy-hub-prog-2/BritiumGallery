package com.maven.demo.repository;

import com.maven.demo.entity.FaqEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<FaqEntity, Long> {
    List<FaqEntity> findByActiveTrue();
}