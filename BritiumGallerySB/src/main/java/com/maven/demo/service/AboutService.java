package com.maven.demo.service;

import com.maven.demo.entity.AboutEntity;
import com.maven.demo.repository.AboutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AboutService {
    @Autowired
    private AboutRepository repo;

    public List<AboutEntity> getAll() {
        return repo.findAll();
    }

    public AboutEntity getById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public AboutEntity create(AboutEntity about) {
        // Ensure no ID is set for new entries
        about.setId(null);
        return repo.save(about);
    }

    public AboutEntity update(Long id, AboutEntity updatedAbout) {
        AboutEntity existing = repo.findById(id).orElse(null);
        if (existing != null) {
            existing.setMission(updatedAbout.getMission());
            existing.setVision(updatedAbout.getVision());
            existing.setStory(updatedAbout.getStory());
            existing.setValueText(updatedAbout.getValueText());
            return repo.save(existing);
        }
        return null;
    }

    public void deleteById(Long id) {
        repo.deleteById(id);
    }
}
