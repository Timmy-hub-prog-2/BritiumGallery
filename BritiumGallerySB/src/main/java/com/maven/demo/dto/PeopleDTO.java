package com.maven.demo.dto;

public class PeopleDTO {
    public Long id;
    public String name;
    public String email;
    public String gender;
    public String phoneNumber;
    public String profilePic;
    public String customerType;
    private Boolean isOnline;
    private String lastSeenAt;
    public Address address;

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }
    public String getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(String lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public static class Address {
        public String houseNumber;
        public String wardName;
        public String street;
        public String township;
        public String city;
        public String state;
        public String country;
        public Double latitude;
        public Double longitude;
    }
}