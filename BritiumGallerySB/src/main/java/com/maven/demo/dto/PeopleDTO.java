package com.maven.demo.dto;

public class PeopleDTO {
    public Long id;
    public String name;
    public String email;
    public String gender;
    public String phoneNumber;
    public String profilePic;
    public String customerType;
    public String dob;
    public String insurance;
    public Address address;

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