package com.maven.demo.entity;

import java.util.List;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "payment")
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "name")
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "payment_qr_urls", joinColumns = @JoinColumn(name = "payment_id"))
    @Column(name = "qr_url")
    private List<String> qrPhotoUrls;

    @Column(name = "admin_id")
    private long admin_id;

}
