package com.maven.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.maven.demo.entity.UserOnlineStatusEntity;
import com.maven.demo.repository.UserOnlineStatusRepository;

@Service
public class UserOnlineStatusService {

    @Autowired
    private UserOnlineStatusRepository userOnlineStatusRepository;

    // Run every 30 seconds to check for users who haven't sent heartbeats
    @Scheduled(cron = "*/30 * * * * *")
    @Transactional
    public void checkAndUpdateOfflineUsers() {
        LocalDateTime thirtySecondsAgo = LocalDateTime.now().minusSeconds(30);
        
        // Find all online users whose last heartbeat was more than 30 seconds ago
        List<UserOnlineStatusEntity> staleOnlineUsers = userOnlineStatusRepository
            .findByOnlineTrueAndUpdatedAtBefore(thirtySecondsAgo);
        
        for (UserOnlineStatusEntity status : staleOnlineUsers) {
            System.out.println("Setting user " + status.getUser().getId() + " as offline due to heartbeat timeout");
            status.setOnline(false);
            status.setLastOnlineAt(LocalDateTime.now());
            status.setUpdatedAt(LocalDateTime.now());
            userOnlineStatusRepository.save(status);
        }
        
        if (!staleOnlineUsers.isEmpty()) {
            System.out.println("Set " + staleOnlineUsers.size() + " users as offline due to heartbeat timeout");
        }
    }
} 