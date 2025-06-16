package com.maven.demo.repository;

import com.maven.demo.entity.VariantAttributeValueEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VariantAttributeValueRepository extends JpaRepository<VariantAttributeValueEntity, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM VariantAttributeValueEntity v WHERE v.productVariant.id IN (" +
            "SELECT pv.id FROM ProductVariantEntity pv WHERE pv.product.category.id = :categoryId)")
        void deleteByCategoryId(@Param("categoryId") Long categoryId);

    @Modifying
    @Transactional
    @Query("DELETE FROM VariantAttributeValueEntity v WHERE v.attribute.id = :attributeId")
    void deleteByAttributeId(Long attributeId);


}
