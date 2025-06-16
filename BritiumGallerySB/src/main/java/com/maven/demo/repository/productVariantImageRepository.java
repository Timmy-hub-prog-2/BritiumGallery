package com.maven.demo.repository;

import com.maven.demo.entity.ProductVariantImage;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface productVariantImageRepository extends JpaRepository<ProductVariantImage,Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM ProductVariantImage p WHERE p.variant.id = :variantId")
     void deleteByVariantId(Long variantId);


}
