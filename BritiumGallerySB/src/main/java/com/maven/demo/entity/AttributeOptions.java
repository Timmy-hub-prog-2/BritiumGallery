package com.maven.demo.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "attribute_options")
public class AttributeOptions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "attribute_id")
    private AttributeEntity attribute;

    @Column(nullable = false)
    private String value;


    // ✅ Add this constructor for manual creation
    public AttributeOptions(AttributeEntity attribute, String value) {
        this.attribute = attribute;
        this.value = value;
    }
}
