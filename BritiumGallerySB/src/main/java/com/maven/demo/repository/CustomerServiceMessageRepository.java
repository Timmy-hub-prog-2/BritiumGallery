package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.CustomerServiceMessageEntity;

import java.util.List;

@Repository
public interface CustomerServiceMessageRepository extends JpaRepository<CustomerServiceMessageEntity, Long> {
    List<CustomerServiceMessageEntity> findBySessionId(Long sessionId);
    @Query("SELECT m FROM CustomerServiceMessageEntity m WHERE m.session.id = :sessionId AND m.isRead = false AND m.sender.id = m.session.assignedAgent.id")
    List<CustomerServiceMessageEntity> findUnreadAgentMessagesBySessionId(@Param("sessionId") Long sessionId);
} 