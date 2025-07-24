package com.maven.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "category")
public class CategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "name")
    private String name;

    @Column(name = "created_at")
    private LocalDateTime created_at;

    @Column(name = "admin_id")
    private long admin_id;

    @Column(name = "status", nullable = false)
    private int status = 1;

    @ManyToOne
    @JoinColumn(name = "parent_category_id")
    private CategoryEntity parentCategory;

    @Column(name = "image_url")
    private String image_url;

    @OneToMany(mappedBy = "parentCategory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CategoryEntity> subcategories = new ArrayList<>();


    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AttributeEntity> attributes = new ArrayList<>();

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductEntity> products;
}
