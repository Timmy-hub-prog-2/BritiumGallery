package com.maven.demo.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.service.CloudinaryUploadService;

@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "http://localhost:4200")
public class FileUploadController {

    @Autowired
    private CloudinaryUploadService cloudinaryService;

    @PostMapping("/receipt")
    public ResponseEntity<String> uploadReceipt(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = cloudinaryService.uploadToCloudinary(file, "receipts");
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to upload file: " + e.getMessage());
        }
    }
} 