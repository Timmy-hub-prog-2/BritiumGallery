package com.maven.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryDTO {
    private Integer id;
    private String type;
    private String name;
    private Long adminId;
    private Integer feesPer1km;
    private String fixAmount;
    private String minDelayTime;

//  private Double shopLat;
//  private Double shopLng;

}
