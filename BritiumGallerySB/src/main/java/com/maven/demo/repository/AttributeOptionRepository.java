package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import com.maven.demo.entity.AttributeOptions;

@Repository
public interface AttributeOptionRepository extends JpaRepository<AttributeOptions, Long> {
    
    @Modifying
    @Transactional
    @Query("DELETE FROM AttributeOptions o WHERE o.attribute.id = :attributeId")
    void deleteByAttributeId(Long attributeId);

    List<AttributeOptions> findByAttributeId(Long attributeId);

    Optional<AttributeOptions> findByAttributeIdAndValueIgnoreCase(Long attributeId, String value);
}
