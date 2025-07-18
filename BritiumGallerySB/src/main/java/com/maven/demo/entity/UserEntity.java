package com.maven.demo.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

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

    @Column(name = "created_at")
    private LocalDateTime createdAt;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_type_id")
    private CustomerTypeEntity customerType;

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<TotalSpendEntity> totalSpends;

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<UserCouponUsageEntity> usedCoupons;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<OtpEntity> otpList;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<AddressEntity> addresses;

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<WishlistEntity> wishlists;

    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<DeliveryEntity> deliveries;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<OrderEntity> orders;

    @JsonIgnore
    @OneToMany(mappedBy = "recipient")
    private List<NotificationEntity> notifications;

}
