package com.maven.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddressDTO {
    private Long id;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Township is required")
    private String township;

    @NotBlank(message = "Street is required")
    private String street;

    @NotBlank(message = "House number is required")
    private String houseNumber;

    @NotBlank(message = "Ward name is required")
    private String wardName;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    private String state;
    private String country;
    private String postalCode;
    private Long userId;
    private boolean mainAddress;
}