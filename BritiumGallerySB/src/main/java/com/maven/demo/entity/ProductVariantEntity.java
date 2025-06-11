package com.maven.demo.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
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

@Entity
@Getter
@Setter
@Table(name = "ProductVariant")
public class ProductVariantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private ProductEntity product;

    @Column(name = "price")
    private int price;

    @Column(name = "stock")
    private int stock;

    @Column(name = "admin_id")
    private Long admin_id;

    @OneToMany(mappedBy = "productVariant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<VariantAttributeValueEntity> attributeValues = new ArrayList<>();

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProductVariantImage> images = new ArrayList<>();

    public ProductVariantEntity() {
        this.images = new ArrayList<>();
        this.attributeValues = new ArrayList<>();
    }

    // Helper method to manage attribute values
    public void addAttributeValue(VariantAttributeValueEntity value) {
        attributeValues.add(value);
        value.setProductVariant(this);
    }

    public void removeAttributeValue(VariantAttributeValueEntity value) {
        attributeValues.remove(value);
        value.setProductVariant(null);
    }

    public void clearAttributeValues() {
        for (VariantAttributeValueEntity value : new ArrayList<>(attributeValues)) {
            removeAttributeValue(value);
        }
    }
}
