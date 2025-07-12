package com.maven.demo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "about")
@Getter
@Setter
public class AboutEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mission;
    private String vision;

    @Column(columnDefinition = "TEXT")
    private String story;

    @Column(columnDefinition = "TEXT")
    private String valueText;
}
