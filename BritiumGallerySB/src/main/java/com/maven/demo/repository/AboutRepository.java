package com.maven.demo.repository;

import com.maven.demo.entity.AboutEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AboutRepository extends JpaRepository<AboutEntity, Long> {
}

