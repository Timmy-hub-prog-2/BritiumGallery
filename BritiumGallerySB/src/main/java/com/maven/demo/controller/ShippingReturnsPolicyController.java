package com.maven.demo.controller;

import com.maven.demo.entity.ShippingReturnsPolicyEntity;
import com.maven.demo.service.ShippingReturnsPolicyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/policy")
public class ShippingReturnsPolicyController {

    @Autowired
    private ShippingReturnsPolicyService service;

    @GetMapping
    public List<ShippingReturnsPolicyEntity> getAll() {
        return service.getAllPolicies();
    }

    @PostMapping
    public ShippingReturnsPolicyEntity create(@RequestBody ShippingReturnsPolicyEntity policy) {
        return service.savePolicy(policy);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShippingReturnsPolicyEntity> update(@PathVariable Long id, @RequestBody ShippingReturnsPolicyEntity updated) {
        return service.getPolicyById(id)
                .map(existing -> {
                    existing.setTitle(updated.getTitle());
                    existing.setContent(updated.getContent());
                    existing.setDisplayOrder(updated.getDisplayOrder());
                    return ResponseEntity.ok(service.savePolicy(existing));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deletePolicy(id);
    }
}
