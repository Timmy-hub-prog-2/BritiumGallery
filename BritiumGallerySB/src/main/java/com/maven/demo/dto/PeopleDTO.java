package com.maven.demo.dto;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeopleDTO {
    private Long id;
    private String name;
    private String email;
    private String password;
    private String status;
    private String gender;
    private String address;
    private String phNumber;
    private Long roleId;
    private String roleName;
}