package com.maven.demo.service;

import com.maven.demo.entity.ShippingReturnsPolicyEntity;
import com.maven.demo.repository.ShippingReturnsPolicyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ShippingReturnsPolicyService {

    @Autowired
    private ShippingReturnsPolicyRepository repository;

    public List<ShippingReturnsPolicyEntity> getAllPolicies() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    public ShippingReturnsPolicyEntity savePolicy(ShippingReturnsPolicyEntity policy) {
        return repository.save(policy);
    }

    public void deletePolicy(Long id) {
        repository.deleteById(id);
    }

    public Optional<ShippingReturnsPolicyEntity> getPolicyById(Long id) {
        return repository.findById(id);
    }
}
