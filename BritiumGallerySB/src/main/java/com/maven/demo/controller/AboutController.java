package com.maven.demo.controller;

import com.maven.demo.entity.AboutEntity;
import com.maven.demo.service.AboutService;
import com.maven.demo.service.CloudinaryUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/about")
@CrossOrigin(origins = "http://localhost:4200")
public class AboutController {

    @Autowired
    private AboutService service;

    @Autowired
    private CloudinaryUploadService cloudinaryService;


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

    // CREATE
    @PostMapping
    public AboutEntity create(@RequestParam("file") MultipartFile file,
                              @RequestParam("mission") String mission,
                              @RequestParam("vision") String vision,
                              @RequestParam("story") String story,
                              @RequestParam("valueText") String valueText) {
        AboutEntity about = new AboutEntity();
        about.setMission(mission);
        about.setVision(vision);
        about.setStory(story);
        about.setValueText(valueText);

        if (file != null && !file.isEmpty()) {
            try {
                String imageUrl = cloudinaryService.uploadToCloudinary(file, "about");
                about.setImageUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image", e);
            }
        }

        return service.create(about);
    }


    // UPDATE
    @PutMapping("/{id}")
    public AboutEntity update(@PathVariable Long id,
                              @RequestParam("file") MultipartFile file,
                              @RequestParam("mission") String mission,
                              @RequestParam("vision") String vision,
                              @RequestParam("story") String story,
                              @RequestParam("valueText") String valueText) {
        AboutEntity existing = service.getById(id);
        if (existing != null) {
            existing.setMission(mission);
            existing.setVision(vision);
            existing.setStory(story);
            existing.setValueText(valueText);

            if (file != null && !file.isEmpty()) {
                try {
                    String imageUrl = cloudinaryService.uploadToCloudinary(file, "about");
                    existing.setImageUrl(imageUrl);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload image", e);
                }
            }

            return service.update(id, existing);
        }
        return null;
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}