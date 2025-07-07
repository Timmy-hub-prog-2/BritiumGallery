package com.maven.demo.repository;

import com.maven.demo.entity.BrandEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<BrandEntity, Long> {
    Optional<BrandEntity> findByName(String name);
    
    // Retrieve all brands ordered by id ascending
    List<BrandEntity> findAllByOrderByIdAsc();
}
