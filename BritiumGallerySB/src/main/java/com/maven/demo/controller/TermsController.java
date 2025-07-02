package com.maven.demo.controller;


import com.maven.demo.dto.TermsDTO;
import com.maven.demo.entity.TermsEntity;
import com.maven.demo.repository.TermsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/terms")
@CrossOrigin(origins = "http://localhost:4200")
public class TermsController {

    @Autowired
    private TermsRepository termsRepository;

    @GetMapping("/latest")
    public ResponseEntity<TermsDTO> getLatestTerms() {
        return termsRepository.findByActiveTrue()
                .map(terms -> {
                    TermsDTO dto = new TermsDTO();
                    dto.setId(terms.getId());
                    dto.setTitle(terms.getTitle());
                    dto.setContent(terms.getContent());
                    return ResponseEntity.ok(dto);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TermsEntity> createTerms(@RequestBody TermsEntity terms) {
        // Deactivate existing active terms if needed
        termsRepository.findByActiveTrue().ifPresent(existing -> {
            existing.setActive(false);
            termsRepository.save(existing);
        });

        terms.setId(null); // Ensure it's new
        TermsEntity saved = termsRepository.save(terms);
        return ResponseEntity.ok(saved);
    }

    // Update existing Terms by ID
    @PutMapping("/{id}")
    public ResponseEntity<TermsEntity> updateTerms(@PathVariable Long id, @RequestBody TermsEntity terms) {
        Optional<TermsEntity> existingOpt = termsRepository.findById(id);
        if (existingOpt.isPresent()) {
            TermsEntity existing = existingOpt.get();
            existing.setTitle(terms.getTitle());
            existing.setContent(terms.getContent());
            existing.setActive(terms.isActive());
            return ResponseEntity.ok(termsRepository.save(existing));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTerms(@PathVariable Long id) {
        if (termsRepository.existsById(id)) {
            termsRepository.deleteById(id);
            return ResponseEntity.noContent().build(); // 204 No Content
        } else {
            return ResponseEntity.notFound().build(); // 404 Not Found
        }
    }
    @GetMapping
    public ResponseEntity<List<TermsEntity>> getAllTerms() {
        return ResponseEntity.ok(termsRepository.findAll());
    }

}
