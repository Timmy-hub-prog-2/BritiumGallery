package com.maven.demo.repository;

import java.util.List;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.demo.entity.AttributeOptions;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AttributeOptionRepository extends JpaRepository<AttributeOptions, Long> {


    @Modifying
    @Transactional
    @Query("DELETE FROM AttributeOptions o WHERE o.attribute.id = :attributeId")
    void deleteByAttributeId(Long attributeId);



    List<AttributeOptions> findByAttributeId(Long attributeId);
}
