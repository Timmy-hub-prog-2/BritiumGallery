package com.maven.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.CategoryEntity;

public interface AttributeRepository extends JpaRepository<AttributeEntity, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM AttributeEntity a WHERE a.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);
    List<AttributeEntity> findByCategoryId(Long categoryId);

    Optional<AttributeEntity> findByNameAndCategory(String name, CategoryEntity category);

    @Modifying
    @Transactional
    @Query("DELETE FROM AttributeEntity a WHERE a.category.id = :categoryId")
    void deleteByCategoryId2(Long categoryId);

    List<AttributeEntity> findByCategoryIdIn(List<Long> categoryIds);

    Optional<AttributeEntity> findByNameIgnoreCaseAndCategoryId(String name, Long categoryId);
    List<AttributeEntity> findByCategory(CategoryEntity category);

}
