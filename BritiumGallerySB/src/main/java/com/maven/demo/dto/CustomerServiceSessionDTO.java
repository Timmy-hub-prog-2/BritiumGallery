package com.maven.demo.dto;

public class CustomerServiceSessionDTO {
    public Long id;
    public Long customerId;
    public String customerName;
    public Long assignedAgentId;
    public String assignedAgentName;
    private String status;
    private String closedAt;
    private Long closedBy;
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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getClosedAt() { return closedAt; }
    public void setClosedAt(String closedAt) { this.closedAt = closedAt; }
    public Long getClosedBy() { return closedBy; }
    public void setClosedBy(Long closedBy) { this.closedBy = closedBy; }
} 