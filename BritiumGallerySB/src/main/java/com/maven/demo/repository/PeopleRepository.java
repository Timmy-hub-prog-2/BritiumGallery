package com.maven.demo.repository;
import com.maven.demo.entity.PeopleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeopleRepository extends JpaRepository<PeopleEntity, Long> {
    List<com.maven.demo.entity.PeopleEntity> findByRole_Id(Long roleId);
}
