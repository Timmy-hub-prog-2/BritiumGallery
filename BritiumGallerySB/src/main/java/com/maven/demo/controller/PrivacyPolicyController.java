package com.maven.demo.controller;

import com.maven.demo.dto.PrivacyPolicyDTO;
import com.maven.demo.entity.PrivacyPolicyEntity;
import com.maven.demo.repository.PrivacyPolicyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/privacy-policy")
@CrossOrigin(origins = "http://localhost:4200")
public class PrivacyPolicyController {

    @Autowired
    private PrivacyPolicyRepository repository;

    // ✅ Get the latest active policy
    @GetMapping("/latest")
    public ResponseEntity<PrivacyPolicyDTO> getLatestActivePolicy() {
        return repository.findFirstByActiveTrueOrderByUpdatedAtDesc()
                .map(policy -> {
                    PrivacyPolicyDTO dto = new PrivacyPolicyDTO();
                    dto.setId(policy.getId());
                    dto.setContent(policy.getContent());
                    dto.setActive(policy.isActive());
                    return ResponseEntity.ok(dto);
                }).orElse(ResponseEntity.notFound().build());
    }

    // ✅ Create new policy and deactivate the previous one
    @PostMapping
    public ResponseEntity<PrivacyPolicyEntity> createPolicy(@RequestBody PrivacyPolicyEntity policy) {
        // Deactivate old active
        repository.findFirstByActiveTrueOrderByUpdatedAtDesc().ifPresent(old -> {
            old.setActive(false);
            repository.save(old);
        });

        policy.setId(null); // Force create
        policy.setUpdatedAt(LocalDateTime.now());
        policy.setActive(true); // Automatically set new one as active

        PrivacyPolicyEntity saved = repository.save(policy);
        return ResponseEntity.ok(saved);
    }

    // ✅ Update existing policy
    @PutMapping("/{id}")
    public ResponseEntity<PrivacyPolicyEntity> updatePolicy(@PathVariable Long id, @RequestBody PrivacyPolicyEntity policy) {
        Optional<PrivacyPolicyEntity> existingOpt = repository.findById(id);
        if (existingOpt.isPresent()) {
            PrivacyPolicyEntity existing = existingOpt.get();
            existing.setContent(policy.getContent());
            existing.setActive(policy.isActive());
            existing.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(repository.save(existing));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ List all policies (admin use)
    @GetMapping
    public ResponseEntity<List<PrivacyPolicyEntity>> getAllPolicies() {
        return ResponseEntity.ok(repository.findAll());
    }
}
