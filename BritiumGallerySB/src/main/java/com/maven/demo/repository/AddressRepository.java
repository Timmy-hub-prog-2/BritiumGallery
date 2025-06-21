package com.maven.demo.repository;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface AddressRepository extends JpaRepository<AddressEntity, Long> {
    List<AddressEntity> findByUserId(Long userId);

    long countByUser(UserEntity user);

    @Modifying
    @Query("UPDATE AddressEntity a SET a.mainAddress = false WHERE a.user.id = :userId")
    void clearMainAddressForUser(@Param("userId") Long userId);

    Optional<AddressEntity> findByUserIdAndMainAddressTrue(Long userId);


}