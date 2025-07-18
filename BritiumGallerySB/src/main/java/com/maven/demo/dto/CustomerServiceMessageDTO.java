package com.maven.demo.dto;

import java.time.LocalDateTime;

public class CustomerServiceMessageDTO {
    public Long id;
    public Long senderId;
    public String content;
    public boolean agent;
    public LocalDateTime sentAt;
    public boolean isRead;

    public CustomerServiceMessageDTO(Long id, Long senderId, String content, boolean agent, LocalDateTime sentAt, boolean isRead) {
        this.id = id;
        this.senderId = senderId;
        this.content = content;
        this.agent = agent;
        this.sentAt = sentAt;
        this.isRead = isRead;
    }
} 