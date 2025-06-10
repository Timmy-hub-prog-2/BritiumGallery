package com.maven.demo.repository;
import com.maven.demo.entity.PeopleEntity;
import com.maven.demo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeopleRepository extends JpaRepository<UserEntity, Long> {
    List<com.maven.demo.entity.UserEntity> findByRole_Id(Long roleId);
}
