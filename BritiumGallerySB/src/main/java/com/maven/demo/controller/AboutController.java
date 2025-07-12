package com.maven.demo.controller;

import com.maven.demo.entity.AboutEntity;
import com.maven.demo.service.AboutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/about")
@CrossOrigin(origins = "http://localhost:4200")
public class AboutController {

    @Autowired
    private AboutService service;

    @GetMapping
    public List<AboutEntity> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AboutEntity> getById(@PathVariable Long id) {
        AboutEntity about = service.getById(id);
        return about != null ? ResponseEntity.ok(about) : ResponseEntity.notFound().build();
    }

    // CREATE
    @PostMapping
    public ResponseEntity<AboutEntity> create(@RequestBody AboutEntity about) {
        AboutEntity saved = service.create(about);
        return ResponseEntity.ok(saved);
    }

    // EDIT
    @PutMapping("/{id}")
    public ResponseEntity<AboutEntity> update(@PathVariable Long id, @RequestBody AboutEntity about) {
        AboutEntity updated = service.update(id, about);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}