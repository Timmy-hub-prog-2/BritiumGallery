package com.maven.demo.repository;

import com.maven.demo.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity,Long> {

    List<CategoryEntity> findByParentCategoryId(Long parentCategoryId);

    // Optional: find root categories (no parent)
    List<CategoryEntity> findByParentCategoryIsNull();

//    List<CategoryEntity> findByParentId(Long parentId);
}
