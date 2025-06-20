package com.maven.demo.repository;

import com.maven.demo.entity.CustomerTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerTypeRepository extends JpaRepository<CustomerTypeEntity, Long> {

}
