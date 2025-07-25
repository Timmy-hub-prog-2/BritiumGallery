package com.maven.demo.repository;

import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.UserOnlineStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserOnlineStatusRepository extends JpaRepository<UserOnlineStatusEntity, Long> {
  // UserOnlineStatusEntity findByUser(UserEntity user);
    List<UserOnlineStatusEntity> findByOnlineTrueAndUpdatedAtBefore(LocalDateTime time);

    Optional<UserOnlineStatusEntity> findByUser(UserEntity user);

}