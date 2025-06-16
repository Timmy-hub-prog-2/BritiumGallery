package com.maven.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@Entity
@Table(name = "wishlist")
public class WishlistEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonIgnoreProperties({"wishlists", "otpList", "addresses", "role", "imageUrls"})
    private UserEntity user;

    @ManyToOne
    @JsonIgnoreProperties({"wishlists", "variants", "category"})
    private ProductEntity product;


    private LocalDateTime addedAt = LocalDateTime.now();

    // getters and setters
}
