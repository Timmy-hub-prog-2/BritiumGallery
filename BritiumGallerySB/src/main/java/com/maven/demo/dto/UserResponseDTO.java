package com.maven.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String gender;
    private String phoneNumber;
    private List<String> ImageUrls;
    private AddressDTO address; // Combined address field
    private Integer status;
    private Long roleId;
    private String roleName;
    private String customerType;
    private Integer totalSpend;
    private Boolean isOnline;
    private String lastSeenAt;

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }
    public String getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(String lastSeenAt) { this.lastSeenAt = lastSeenAt; }
}
