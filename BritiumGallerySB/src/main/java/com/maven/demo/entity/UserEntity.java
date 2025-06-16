package com.maven.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name =  "user")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "name", length = 25, nullable = false)
    private String name;

    @Column(name = "email", length = 50, unique = true, nullable = false)
    private String email;

    @Column(name = "password", length = 100, nullable = false)
    private String password;

    @Column(name = "ph_number", length = 20, nullable = false )
    private String phoneNumber;

    @ElementCollection
    @CollectionTable(name = "user_image_urls", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "image_url", length = 225)
    private List<String> imageUrls;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "status")
    private Integer status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private RoleEntity role;

    @OneToMany(mappedBy = "user" , cascade =  CascadeType.ALL)
    private List<OtpEntity> otpList;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<AddressEntity> addresses;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<WishlistEntity> wishlists;

}
