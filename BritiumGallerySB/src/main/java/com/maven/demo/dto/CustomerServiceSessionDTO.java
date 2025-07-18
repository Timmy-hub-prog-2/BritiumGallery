package com.maven.demo.dto;

public class CustomerServiceSessionDTO {
    public Long id;
    public Long customerId;
    public String customerName;
    public Long assignedAgentId;
    public String assignedAgentName;
    public String status;
    public String lastMessage;
    public String lastMessageTime;
    public int unreadCount;
    public String profilePic;

    public CustomerServiceSessionDTO(Long id, Long customerId, String customerName, Long assignedAgentId, String assignedAgentName, String status) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.assignedAgentId = assignedAgentId;
        this.assignedAgentName = assignedAgentName;
        this.status = status;
    }

    public CustomerServiceSessionDTO(Long id, Long customerId, String customerName, Long assignedAgentId, String assignedAgentName, String status, String lastMessage, String lastMessageTime, int unreadCount, String profilePic) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.assignedAgentId = assignedAgentId;
        this.assignedAgentName = assignedAgentName;
        this.status = status;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
        this.unreadCount = unreadCount;
        this.profilePic = profilePic;
    }
} 