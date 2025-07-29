package com.maven.demo.dto;

import lombok.Data;

@Data
public class ActiveUserStatsDTO {
    private Integer totalUsers;
    private Integer onlineUsers;
    private Integer recentUsers;
    private Integer offlineUsers;
    private Double growthRate;
} 