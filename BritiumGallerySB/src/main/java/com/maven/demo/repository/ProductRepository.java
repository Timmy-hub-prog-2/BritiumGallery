package com.maven.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.ProductEntity;

import jakarta.transaction.Transactional;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    List<ProductEntity> findByCategoryId(Long categoryId);

    List<ProductEntity> findByCategoryIdIn(List<Long> categoryIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProductEntity p WHERE p.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);

    List<ProductEntity> findByBrandId(Long brandId);

    List<ProductEntity> findByBrandIdAndCategoryId(Long brandId, Long categoryId);


    // You can add custom query methods here if needed, e.g.:
    // List<ProductEntity> findByCategory_Id(Long categoryId);
}
