package com.maven.demo.service;


import com.maven.demo.entity.PaymentEntity;
import com.maven.demo.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository repository;

    public List<PaymentEntity> getAll() {
        return repository.findAll();
    }

    public PaymentEntity getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public PaymentEntity create(PaymentEntity register) {
        return repository.save(register);
    }

    public PaymentEntity update(Long id, PaymentEntity newData) {
        PaymentEntity existing = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Not found"));

        existing.setName(newData.getName());
        existing.setAdmin_id(newData.getAdmin_id());

        if (newData.getQrPhotoUrls() != null && !newData.getQrPhotoUrls().isEmpty()) {
            existing.setQrPhotoUrls(newData.getQrPhotoUrls());
        }

        return repository.save(existing);
    }




    public void delete(Long id) {
        repository.deleteById(id);
    }
}
